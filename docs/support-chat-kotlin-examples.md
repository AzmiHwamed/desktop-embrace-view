# Kotlin examples for support chat

Companion to [the implementation guide](support-chat-kotlin-multiplatform.md). These examples implement the transport and merge logic; wire them into your existing ViewModel, authenticated HTTP client, and Compose screen.

**Assumptions:** Kotlin 2.3+ for stable `kotlin.time.Instant`, Ktor 3.x, kotlinx serialization, and coroutines. Keep library versions compatible with your mobile project. No mobile build was available here, so these snippets have not been compiled.

## Dependencies and file placement

| Source set | Dependencies |
| --- | --- |
| `commonMain` | `io.ktor:ktor-client-core`, `io.ktor:ktor-client-content-negotiation`, `io.ktor:ktor-serialization-kotlinx-json`, `org.jetbrains.kotlinx:kotlinx-serialization-json`, `org.jetbrains.kotlinx:kotlinx-coroutines-core` |
| `androidMain` | `io.ktor:ktor-client-okhttp`, `com.google.firebase:firebase-auth`, `com.google.firebase:firebase-database`, `org.jetbrains.kotlinx:kotlinx-coroutines-play-services` |

Apply the Kotlin serialization compiler plugin matching your Kotlin version. Align Firebase modules using the Firebase Android BoM in the module that compiles the adapter. In the Android app, apply the Google services plugin, add `google-services.json`, and declare `android.permission.INTERNET`. [Firebase setup](https://firebase.google.com/docs/android/setup)

Configure the shared Ktor client with `ContentNegotiation { json(Json { ignoreUnknownKeys = true }) }`. Inject the app's authenticated client so token refresh remains centralized. [Ktor JSON configuration](https://ktor.io/docs/client-serialization.html)

Suggested files:

```text
commonMain/.../chat/
  ChatModels.kt
  ChatApi.kt
  ChatRealtime.kt
  ChatMessageStore.kt

androidMain/.../chat/
  AndroidChatRealtime.kt
```

## 1. Models — commonMain/ChatModels.kt

Metadata not used by chat is ignored by the JSON decoder. Nullable conversation fields have defaults for absent values.

```kotlin
import kotlinx.serialization.Serializable

@Serializable
data class ApiEnvelope<T>(val data: T)

@Serializable
data class Conversation(
    val id: String,
    val userId: String,
    val userDisplayName: String? = null,
    val lastMessagePreview: String? = null,
    val lastMessageAt: String? = null,
    val unreadByAdmin: Int,
    val unreadByUser: Int,
)

@Serializable
data class Message(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val senderRole: String,
    val body: String,
    val isRead: Boolean,
    val createdAt: String,
)

@Serializable
data class SendBody(val body: String)

@Serializable
data class FirebaseToken(val customToken: String)
```

## 2. REST client — commonMain/ChatApi.kt

The injected `accessToken` returns the current app ID token. The surrounding app HTTP layer must handle refresh and a single retry on 401. Do not install an automatic retry policy for message POSTs after timeouts or server errors.

For parity with web, refresh uses `POST /auth/refresh` with `{"refreshToken":"..."}`; read token fields from response `data` (`access_token` / `refresh_token`, or `idToken` / `refreshToken`). Never use the Firebase custom token as this REST access token.

```kotlin
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.expectSuccess
import io.ktor.client.request.*
import io.ktor.client.statement.HttpResponse
import io.ktor.http.*

class ChatApi(
    private val client: HttpClient,
    baseUrl: String,
    private val accessToken: suspend () -> String,
) {
    private val base = baseUrl.trimEnd('/')

    private suspend fun call(
        path: String,
        verb: HttpMethod,
        configure: HttpRequestBuilder.() -> Unit = {},
    ): HttpResponse {
        val token = accessToken()
        return client.request("$base$path") {
            method = verb
            expectSuccess = true
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            configure()
        }
    }

    suspend fun conversation(): Conversation =
        call("/chat/conversations/me", HttpMethod.Get)
            .body<ApiEnvelope<Conversation>>().data

    suspend fun history(
        conversationId: String,
        before: String? = null,
    ): List<Message> =
        call("/chat/conversations/$conversationId/messages", HttpMethod.Get) {
            parameter("limit", 50)
            before?.let { parameter("before", it) }
        }.body<ApiEnvelope<List<Message>>>().data

    suspend fun send(conversationId: String, draft: String): Message {
        val text = draft.trim()
        require(text.isNotEmpty()) { "Enter a message." }
        // Conservative UTF-16 limit; the backend declares max length 4,000.
        require(text.length <= 4_000) { "Message is too long." }

        return call(
            "/chat/conversations/$conversationId/messages",
            HttpMethod.Post,
        ) {
            setBody(SendBody(text))
        }.body<ApiEnvelope<Message>>().data
    }

    suspend fun markRead(conversationId: String) {
        call("/chat/conversations/$conversationId/read", HttpMethod.Patch)
        // Intentionally do not decode a Message or Unit from data:null.
    }

    suspend fun firebaseToken(): String =
        call("/auth/firebase-token", HttpMethod.Post)
            .body<ApiEnvelope<FirebaseToken>>().data.customToken
}
```

Ktor throws on non-success responses here. Translate errors in the app error layer: a 401 invokes session handling; 403 means access denied; 404 means conversation missing; transport failures offer retry. Do not convert coroutine cancellation into a user-visible error.

## 3. Shared Firebase boundary — commonMain/ChatRealtime.kt

```kotlin
import kotlinx.coroutines.flow.Flow

interface ChatRealtime {
    suspend fun signIn(customToken: String)
    fun messages(conversationId: String): Flow<List<Message>>
    fun connected(): Flow<Boolean>
    fun signOut()
}
```

## 4. Android Firebase adapter — androidMain/AndroidChatRealtime.kt

Pass `FirebaseDatabase.getInstance(databaseUrl)` using the same database URL as web. Firebase Auth and Database must belong to the same Firebase app/project.

This adapter reads complete snapshots, matching the current web implementation. A conflated channel keeps the newest complete snapshot if the consumer is briefly busy. It does not provide server-side history pagination; REST does that. For a very large conversation, add a coordinated bounded live query and database index as a separate optimization.

```kotlin
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.buffer
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlin.time.Instant

class AndroidChatRealtime(
    private val auth: FirebaseAuth,
    private val database: FirebaseDatabase,
) : ChatRealtime {

    override suspend fun signIn(customToken: String) {
        auth.signInWithCustomToken(customToken).await()
    }

    override fun messages(conversationId: String): Flow<List<Message>> =
        snapshots(database.getReference("chats/messages/$conversationId")) {
            snapshot ->
            snapshot.children.map { child ->
                Message(
                    id = requireNotNull(child.key),
                    conversationId = conversationId,
                    senderId = requireNotNull(
                        child.child("senderId").getValue(String::class.java)
                    ),
                    senderRole = requireNotNull(
                        child.child("senderRole").getValue(String::class.java)
                    ),
                    body = requireNotNull(
                        child.child("body").getValue(String::class.java)
                    ),
                    isRead = requireNotNull(
                        child.child("isRead").getValue(Boolean::class.java)
                    ),
                    createdAt = Instant.fromEpochMilliseconds(
                        requireNotNull(
                            child.child("createdAt").getValue(Long::class.java)
                        )
                    ).toString(),
                )
            }
        }

    override fun connected(): Flow<Boolean> =
        snapshots(database.getReference(".info/connected")) {
            it.getValue(Boolean::class.java) == true
        }

    override fun signOut() {
        auth.signOut()
    }

    private fun <T> snapshots(
        reference: DatabaseReference,
        decode: (DataSnapshot) -> T,
    ): Flow<T> = callbackFlow {
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    trySend(decode(snapshot))
                } catch (error: Exception) {
                    close(error)
                }
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        reference.addValueEventListener(listener)
        awaitClose { reference.removeEventListener(listener) }
    }.buffer(Channel.CONFLATED)
}
```

`await()` bridges Firebase tasks to suspending calls; `awaitClose` cleans up the listener when collection ends. [Coroutine Firebase task integration](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-play-services/) and [callbackFlow lifecycle](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html)

At screen/session startup, call `realtime.signIn(api.firebaseToken())` before collecting messages. Coordinate simultaneous sign-ins through the app session layer. Do not merely skip sign-in because a Google/Facebook SDK user exists; establish the backend-issued chat session for the current app account.

## 5. Merge messages — commonMain/ChatMessageStore.kt

Create one store per conversation and account session. Every history page, live snapshot, and successful send response passes through the same method. Recreate the store on logout/account switch after cancelling prior jobs.

```kotlin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlin.time.Instant

class ChatMessageStore(private val conversationId: String) {
    private val mutable = MutableStateFlow<List<Message>>(emptyList())
    val messages = mutable.asStateFlow()

    fun merge(incoming: List<Message>) {
        require(incoming.all { it.conversationId == conversationId })

        mutable.update { current ->
            val byId = current.associateBy { it.id }.toMutableMap()
            incoming.forEach { message ->
                val previous = byId[message.id]
                byId[message.id] = message.copy(
                    // RTDB message read flags can be older than SQL history.
                    isRead = message.isRead || previous?.isRead == true,
                )
            }
            byId.values.sortedWith(
                compareBy<Message> { Instant.parse(it.createdAt) }
                    .thenBy { it.id }
            )
        }
    }
}
```

Use parsed instants for ordering, rather than sorting raw ISO text with potentially different offsets/precision. [Kotlin Instant](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.time/-instant/)

## 6. ViewModel wiring

The following is **flow pseudocode**, not another class to paste. It makes lifecycle and error responsibilities explicit without imposing a new ViewModel framework.

```text
on screen active:
    obtain conversation (or reuse it for this account)
    obtain the conversation's message store

    start independent supervised jobs:
        history:
            fetch latest REST page
            merge page into store
            set older cursor from page.firstOrNull()?.createdAt
            report history failure separately

        live messages:
            sign in with api.firebaseToken()
            collect realtime.messages(conversation.id)
            merge each snapshot into store
            record listener-ready after a successful snapshot
            on failure: clear listener-ready and show live retry

        connection:
            collect realtime.connected()
            update transport-connected state
            refresh REST after reconnection

    UI observes store.messages and screen state
    live badge = transport-connected AND listener-ready

on displayed messages change, while screen is active:
    identify newly displayed admin message IDs
    coalesce mark-read calls
    call api.markRead(conversation.id)
    remember acknowledged IDs after success
    if failed, retry on next foreground/explicit refresh
    do not use Firebase isRead=false as a repeating trigger

on send:
    ignore if already sending
    validate/capture draft and set sending before launching
    disable composer editing for this request
    try:
        saved = api.send(conversation.id, draft)
        store.merge([saved])
        clear draft
    catch cancellation:
        rethrow
    catch other failure:
        keep draft; show send error
    finally:
        clear sending

on load older:
    use saved REST cursor (not the oldest Firebase message)
    request older REST page and merge
    advance cursor only from that response
    disable more loading when page size < 50

on screen inactive:
    cancel and join screen live jobs
    keep ViewModel messages/draft for rotation or return as appropriate

on account logout:
    cancel and join all chat jobs
    discard old store and state
    sign out through session manager
```

Catch each child job's failure separately; a failed live listener must not cancel REST loading. A closed Firebase flow needs a new collection on retry. Keep read acknowledgements separate from transport messages because the backend only mirrors conversation-level read counters.

The remaining work in the mobile application is to connect these pieces to its existing session manager and Compose UI, and run the acceptance checks in the main guide. Resolve the documented backend identity mismatch before relying on customer Firebase delivery.

