import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
  OverlayView,
  InfoWindow,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import "../map.css";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

export default function FindDoctor() {
  const [map, setMap] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [directions, setDirections] = useState<any>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");

  // 📍 Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCurrentLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  // 🏥 ADVANCED SEARCH (MULTI + PAGINATION)
  useEffect(() => {
    if (!map || !currentLocation) return;

    const service = new google.maps.places.PlacesService(map);
    let allResults: any[] = [];

    const keywords = [
      "hospital",
      "clinic",
      "doctor",
      "medical",
      "nursing home",
    ];

    keywords.forEach((keyword) => {
      service.nearbySearch(
        {
          location: currentLocation,
          radius: 15000,
          keyword,
        },
        (results: any, status: any, pagination: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            allResults = [...allResults, ...results];

            // 🔁 Pagination
            if (pagination && pagination.hasNextPage) {
              setTimeout(() => pagination.nextPage(), 1000);
            }

            // 🔍 Strict filter
            const filtered = allResults.filter(
              (place: any) =>
                place.types.includes("hospital") ||
                place.types.includes("doctor") ||
                place.types.includes("health") ||
                place.name.toLowerCase().includes("clinic") ||
                place.name.toLowerCase().includes("medical") ||
                place.name.toLowerCase().includes("nursing"),
            );

            // ❌ Remove duplicates
            const unique = Array.from(
              new Map(filtered.map((p) => [p.place_id, p])).values(),
            );

            setPlaces(unique);
          }
        },
      );
    });
  }, [map, currentLocation]);

  // 🚗 ROUTE FUNCTION
  const getRoute = (place: any) => {
    if (!currentLocation) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: currentLocation,
        destination: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === "OK") {
          setDirections(result);

          const leg = result.routes[0].legs[0];
          setDistance(leg.distance.text);
          setDuration(leg.duration.text);
        }
      },
    );
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyAHFnmprUqvoz9H0FQGOlXBWCcJnrHwDvw"
      libraries={["places"]}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation}
        zoom={14}
        onLoad={(map) => setMap(map)}
        options={{
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "poi.medical", stylers: [{ visibility: "on" }] },
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {/* 📍 USER LOCATION */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />
        )}

        {/* 🏥 MEDICAL MARKERS + LABELS */}
        {places.map((place, i) => {
          const position = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };

          return (
            <div key={i}>
              <Marker
                position={position}
                onClick={() => {
                  setSelectedPlace(place);
                  getRoute(place);
                }}
              />

              <OverlayView
                position={position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="label">{place.name}</div>
              </OverlayView>
            </div>
          );
        })}

        {/* 🚗 ROUTE */}
        {directions && <DirectionsRenderer directions={directions} />}

        {/* 📊 INFO BOX */}
        {distance && (
          <div className="info-box">
            <b>Distance:</b> {distance} <br />
            <b>Time:</b> {duration}
          </div>
        )}

        {/* 📍 INFO WINDOW */}
        {selectedPlace && (
          <InfoWindow
            position={{
              lat: selectedPlace.geometry.location.lat(),
              lng: selectedPlace.geometry.location.lng(),
            }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="info-content">
              <h4>{selectedPlace.name}</h4>
              <p>{selectedPlace.vicinity}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
