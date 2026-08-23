export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export class DeviceLocationError extends Error {
  constructor(
    public readonly reason:
      "server" | "insecure" | "unsupported" | "denied" | "unavailable" | "timeout",
  ) {
    super(`Device location is ${reason}.`);
    this.name = "DeviceLocationError";
  }
}

function locationErrorReason(error: GeolocationPositionError): DeviceLocationError["reason"] {
  if (error.code === error.PERMISSION_DENIED) return "denied";
  if (error.code === error.TIMEOUT) return "timeout";
  return "unavailable";
}

/**
 * Reads coordinates from the visitor's browser/device only. This deliberately
 * has no IP-geolocation or server-side fallback, so a VPS location can never
 * be mistaken for the user's current position.
 */
export function getCurrentDeviceLocation(options: PositionOptions = {}): Promise<DeviceLocation> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return Promise.reject(new DeviceLocationError("server"));
  }
  if (!window.isSecureContext) {
    return Promise.reject(new DeviceLocationError("insecure"));
  }
  if (!("geolocation" in navigator)) {
    return Promise.reject(new DeviceLocationError("unsupported"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      (error) => reject(new DeviceLocationError(locationErrorReason(error))),
      options,
    );
  });
}

/**
 * Watches briefly for GPS/Wi-Fi refinement and returns the best reading seen.
 * Desktop browsers often emit a coarse location first and a better fix a few
 * seconds later, which getCurrentPosition alone never observes.
 */
export function getAccurateDeviceLocation(
  options: PositionOptions & { desiredAccuracy?: number } = {},
): Promise<DeviceLocation> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return Promise.reject(new DeviceLocationError("server"));
  }
  if (!window.isSecureContext) {
    return Promise.reject(new DeviceLocationError("insecure"));
  }
  if (!("geolocation" in navigator)) {
    return Promise.reject(new DeviceLocationError("unsupported"));
  }

  const timeout = options.timeout ?? 12000;
  const desiredAccuracy = options.desiredAccuracy ?? 50;

  return new Promise((resolve, reject) => {
    let best: DeviceLocation | null = null;
    let settled = false;
    let watchId = 0;

    const finish = (location?: DeviceLocation, error?: DeviceLocationError) => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      if (location) resolve(location);
      else reject(error ?? new DeviceLocationError("unavailable"));
    };

    const timer = window.setTimeout(
      () => finish(best ?? undefined, best ? undefined : new DeviceLocationError("timeout")),
      timeout,
    );

    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const reading = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        };
        if (!best || reading.accuracy < best.accuracy) best = reading;
        if (reading.accuracy <= desiredAccuracy) finish(reading);
      },
      (error) => finish(best ?? undefined, new DeviceLocationError(locationErrorReason(error))),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        maximumAge: options.maximumAge ?? 0,
        timeout,
      },
    );
  });
}
