export type LegalSection = { id: string; title: string; paragraphs: string[] };

// Supply verified operator details and review the policies before publication.
export const legalDetails = {
  operatorName: "SmartTravel",
  country: "",
  contactEmail: "",
  updated: "September 9, 2026",
  draft: true,
};

export const legalDocuments = {
  terms: {
    title: "Terms of Service",
    description: "The terms for using SmartTravel and its travel tools.",
    icon: "terms",
    sections: [
      {
        id: "service",
        title: "Using SmartTravel",
        paragraphs: [
          "SmartTravel provides travel tools including receipt scanning, expense tracking, currency conversion, trip budgets, nearby place discovery, interpretation, and customer support. These terms describe the conditions for using the service.",
          "Use the service only if you can enter a binding agreement under the laws that apply to you, or have the permission and supervision required by those laws. You are responsible for providing accurate account information and keeping your sign-in credentials secure.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        paragraphs: [
          "Do not use SmartTravel for unlawful activity, fraud, harassment, or infringement of another person's rights. Do not attempt unauthorized access, interfere with the service, bypass access restrictions, or upload malicious content.",
          "Only upload receipts, images, recordings, and other content you are entitled to use. Obtain any permission required before recording or sharing another person's voice or personal information.",
        ],
      },
      {
        id: "your-content",
        title: "Your content",
        paragraphs: [
          "You retain your rights in the content you submit. You authorize SmartTravel and its service providers to process that content as needed to deliver the features you request, such as extracting a receipt, translating text, storing expenses, or answering a support message.",
          "The Privacy Policy explains the information involved in these features. Avoid uploading information that is unnecessary for the task, such as complete payment-card details or sensitive identity documents.",
        ],
      },
      {
        id: "accuracy",
        title: "AI, translations, and travel information",
        paragraphs: [
          "Receipt extraction, translations, interpretation, and generated travel plans can contain errors or omissions. Check important amounts, dates, translations, and recommendations before relying on them.",
          "Currency conversions and budget estimates are informational and may differ from the rates or fees applied by your bank or payment provider. Place information, opening hours, and travel conditions can change. Verify them with the relevant provider. SmartTravel is not an emergency service or a substitute for qualified professional advice.",
        ],
      },
      {
        id: "payments",
        title: "Subscriptions and payments",
        paragraphs: [
          "Some features require a paid plan. The price, currency, access period, and any renewal conditions should be shown before you confirm a purchase. The terms displayed at checkout apply to that purchase, subject to your mandatory consumer rights.",
          "Payments are completed through the payment provider shown at checkout. For billing questions, cancellation, or refund requests, contact support. Deleting your account does not by itself establish that a recurring payment arrangement has been cancelled; check the purchase terms and contact support when needed.",
        ],
      },
      {
        id: "third-parties",
        title: "External services",
        paragraphs: [
          "SmartTravel uses external services for features such as sign-in, maps, payments, and AI processing. Links may take you to services governed by their own terms and privacy policies. SmartTravel does not control those external websites or their availability.",
        ],
      },
      {
        id: "availability",
        title: "Availability and account closure",
        paragraphs: [
          "Features may be updated, interrupted, or withdrawn. Access may be restricted when needed to address misuse, security incidents, or legal requirements. Any rights you have relating to a paid service continue to apply.",
          "You can stop using the service and request account deletion from your Account page. Retention and deletion of information are described in the Privacy Policy.",
        ],
      },
      {
        id: "responsibility",
        title: "Responsibility and your rights",
        paragraphs: [
          "To the extent permitted by applicable law, the service is provided on an as-available basis without a guarantee that it will always be uninterrupted or error-free. You remain responsible for checking outputs and making your travel and spending decisions.",
          "Nothing in these terms excludes liability or consumer protections that cannot lawfully be excluded, or prevents you from exercising rights available under applicable law.",
        ],
      },
      {
        id: "updates",
        title: "Changes and questions",
        paragraphs: [
          "Changes to these terms will be reflected in the version date on this page. Material changes will be communicated where required. Review the current terms before continuing to use affected features.",
          "For questions about these terms or your account, contact SmartTravel support using the contact information below.",
        ],
      },
    ] satisfies LegalSection[],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How information is used when you use SmartTravel.",
    icon: "privacy",
    sections: [
      {
        id: "overview",
        title: "About this policy",
        paragraphs: [
          "This policy describes information processed through SmartTravel's website and connected features. The organization responsible for that processing is identified in the contact section below.",
          "Information processed depends on the features you use. Guest features also send information to servers when needed to complete a request; guest mode does not mean that processing happens only on your device.",
        ],
      },
      {
        id: "information",
        title: "Information you provide",
        paragraphs: [
          "Account information includes your email, display name, sign-in provider, optional profile image, preferred language, currency, country, and subscription status. Authentication credentials are handled through the sign-in flow and its authentication provider.",
          "Feature content may include receipt images and extracted purchase details; expense amounts, merchants, categories, and dates; trip destinations, schedules, budgets, and preferences; voice recordings and interpretation results; and messages you send to customer support.",
          "Billing records may include your selected plan, payment reference, amount, and payment status. Payment information entered on the external checkout page is handled by the payment provider under its own privacy policy.",
        ],
      },
      {
        id: "permissions",
        title: "Location, camera, and microphone",
        paragraphs: [
          "When you grant location permission, SmartTravel can use device coordinates for nearby places, merchant matching, and country-related suggestions or notifications while relevant app features are running. Country detection can send coordinates directly to BigDataCloud's reverse-geocoding service.",
          "Camera or photo access supports receipt capture and uploads. Microphone access supports voice interpretation. Recording audio for interpretation sends that recording to the service for processing. You can revoke permissions in your browser or device settings; features relying on them may then be unavailable.",
        ],
      },
      {
        id: "purposes",
        title: "How information is used",
        paragraphs: [
          "Information is used to authenticate users, maintain accounts, deliver requested features, keep expense and trip records, process subscription access, respond to support requests, and operate and troubleshoot the service.",
          "Text, images, or audio submitted to AI-enabled features are processed to produce extraction, translation, speech, or planning results. Displayed error messages may also be sent for translation into your selected language.",
        ],
      },
      {
        id: "providers",
        title: "Service providers and disclosures",
        paragraphs: [
          "Information needed for a feature is processed by the services supporting it, including hosting and storage, Firebase authentication and live chat delivery, mapping and location services, AI and speech processing, and the payment provider shown at checkout. Choosing Google or Facebook sign-in also involves that provider.",
          "Information may be disclosed when required by law, to address fraud or security incidents, or to protect legal rights. Processing locations depend on the providers used. Where applicable law requires safeguards for cross-border transfers, those requirements apply.",
        ],
      },
      {
        id: "browser-storage",
        title: "Browser storage",
        paragraphs: [
          "The app uses browser storage for sign-in and refresh tokens, guest-mode status, language preferences, cached interface translations, and timing information used by location features. Firebase may also maintain its authentication session in browser storage.",
          "Signing out clears the app's account session and loaded account data. Language preferences and interface translations may remain on the device. Clearing site data in your browser removes local storage, but does not delete records already stored on the service.",
        ],
      },
      {
        id: "retention",
        title: "Retention and deletion",
        paragraphs: [
          "Retention depends on the type of information, the feature involved, and operational or legal requirements. Account, expense, trip, receipt, support, and billing records can have different retention needs. This policy does not promise immediate removal from backups or from a provider's independently maintained records.",
          "You can request account deletion through the Account page. Contact support for information about deletion of particular records or any information retained after a request. Exact retention periods and provider-specific handling must be confirmed by the service operator before this draft is finalized.",
        ],
      },
      {
        id: "choices",
        title: "Your choices and rights",
        paragraphs: [
          "You can update available profile preferences, manage browser permissions, sign out, and request account deletion. Depending on the laws that apply to you, you may also have rights to access, correct, delete, restrict, object to processing, or receive a copy of certain information.",
          "Where processing relies on consent, applicable law may allow you to withdraw it without affecting prior lawful processing. Contact the operator to make a request. Identity verification may be needed to protect your information. You may also have the right to complain to your local data protection authority.",
        ],
      },
      {
        id: "security",
        title: "Security and other people's information",
        paragraphs: [
          "No internet service or storage system can guarantee absolute security. Keep your credentials private, use a trusted device, and sign out on shared devices. Notify support if you suspect unauthorized access.",
          "Only submit information about other people when you are entitled to do so. If you believe a child has provided information without the permission required by applicable law, contact the operator to request review and appropriate action.",
        ],
      },
      {
        id: "changes",
        title: "Policy updates and contact",
        paragraphs: [
          "The version date on this page identifies the latest revision. Material changes will be communicated where required. Contact the operator below with questions about this policy or a privacy request.",
        ],
      },
    ] satisfies LegalSection[],
  },
};
