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
