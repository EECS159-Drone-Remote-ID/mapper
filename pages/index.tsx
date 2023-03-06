import { DroneData } from "@/models/DroneData";
import { basicIdToUasIdString } from "@/utils/DynamoDbDrones";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import styles from "../styles/Home.module.css";

let socket;

const Home = () => {
  const libraries = useMemo(() => ["places"], []);
  const mapCenter = useMemo(
    () => ({ lat: 27.672932021393862, lng: 85.31184012689732 }),
    []
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      clickableIcons: true,
      scrollwheel: false,
    }),
    []
  );

  useEffect(() => {
    socketInitializer();
  }, []);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries as never,
  });

  const drones: DroneData[] = [];

  const socketInitializer = async () => {
    await fetch("/api/socket");
    socket = io();
    socket.on("init-data", (initDrones: DroneData) => {
      Object.assign(drones, initDrones);
    });
  };

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.homeWrapper}>
      <GoogleMap
        options={mapOptions}
        zoom={14}
        center={mapCenter}
        mapTypeId={google.maps.MapTypeId.ROADMAP}
        mapContainerStyle={{ width: "100vw", height: "100vh" }}
        onLoad={() => console.log("Map Component Loaded...")}
      >
        {drones.map((drone) => {
          return (
            <Marker
              key={basicIdToUasIdString(drone.basicId)}
              position={{
                lat: drone.locationVector.latitude,
                lng: drone.locationVector.longitutde,
              }}
            />
          );
        })}
      </GoogleMap>
      ;
    </div>
  );
};

export default Home;
