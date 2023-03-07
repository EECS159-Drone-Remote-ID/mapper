import DroneData from "@/models/DroneData";
import { IDType } from "@/models/IDType";
import { UAType } from "@/models/UAType";
import { basicIdToUasIdString } from "@/utils/DynamoDbDrones";
import { expandMapBounds } from "@/utils/MapUtils";
import {
  GoogleMap,
  InfoWindow,
  MarkerF,
  useLoadScript,
} from "@react-google-maps/api";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../styles/Home.module.css";

let socket: Socket;

const Home = () => {
  useEffect(() => {
    socketInitializer();
  }, []);

  const mapCenter = useMemo(() => ({ lat: 33.6404996, lng: -117.8464849 }), []);

  const [drones, setDrones] = useState<DroneData[]>([]);

  const updateDrones = () => {
    if (map !== null && socket != undefined) {
      socket.emit("get-drones", expandMapBounds(map.getBounds() ?? null));
    }
  };

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const onMapLoad = (loadedMap: google.maps.Map) => {
    console.log("map");
    console.log(loadedMap);
    if (loadedMap !== null) {
      setMap(loadedMap);
      updateDrones();
    }
  };

  const updateBounds = () => {
    console.log("bounds");
    console.log(socket);
    updateDrones();
  };

  const socketInitializer = async () => {
    await fetch("/api/socket");
    socket = io();
    socket.on("list", (droneList: DroneData[]) => {
      console.log(JSON.stringify(droneList));
      setDrones(droneList);
    });
    updateDrones();

    console.log("INIT");
  };

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      streetViewControl: false,
      clickableIcons: true,
      scrollwheel: false,
    }),
    []
  );

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const [activeDroneMarker, setActiveDroneMarker] = useState<string | null>(
    null
  );

  const droneMarkerClicked = (markerClicked: string) => {
    if (markerClicked === activeDroneMarker) {
      return;
    }
    setActiveDroneMarker(markerClicked);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const droneIcon = {
    url: "https://img.icons8.com/ios-glyphs/256/drone.png",
    scaledSize: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 0),
  };

  return (
    <div className={styles.homeWrapper}>
      <GoogleMap
        options={mapOptions}
        zoom={14}
        center={mapCenter}
        mapTypeId={google.maps.MapTypeId.ROADMAP}
        mapContainerStyle={{ width: "100%", height: "100vh" }}
        mapContainerClassName={"map-container"}
        onLoad={onMapLoad}
        onBoundsChanged={updateBounds}
      >
        {drones.map((drone) => (
          <MarkerF
            key={basicIdToUasIdString(drone.basicId)}
            position={{
              lat: drone.locationVector.latitude,
              lng: drone.locationVector.longitude,
            }}
            icon={droneIcon}
            onClick={() =>
              droneMarkerClicked(basicIdToUasIdString(drone.basicId))
            }
          >
            {activeDroneMarker === basicIdToUasIdString(drone.basicId) ? (
              <InfoWindow onCloseClick={() => setActiveDroneMarker(null)}>
                <div>
                  <p>
                    <strong>UAS ID</strong> <span>{drone.basicId.uasId}</span>
                  </p>
                  <p>
                    <strong>ID Type</strong>{" "}
                    <span>{IDType[drone.basicId.idType]}</span>
                  </p>
                  <p>
                    <strong>UA Type</strong>{" "}
                    <span>{UAType[drone.basicId.uaType]}</span>
                  </p>
                  <p>
                    <strong>Latitude</strong>{" "}
                    <span>{drone.locationVector.latitude}</span>
                  </p>
                  <p>
                    <strong>Longitude</strong>{" "}
                    <span>{drone.locationVector.longitude}</span>
                  </p>
                </div>
              </InfoWindow>
            ) : null}
          </MarkerF>
        ))}
      </GoogleMap>
    </div>
  );
};

export default Home;
