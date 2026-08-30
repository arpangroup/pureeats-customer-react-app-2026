export interface Coordinates {
  latitude: number
  longitude: number
}

/** Wraps the browser Geolocation API in a promise; rejects with a friendly message on denial/timeout. */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => reject(new Error("Couldn't access your location — please enter your address manually.")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  })
}
