import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { NativeBackButton } from "@/components/NativeBackButton";
import { Home } from "@/pages/Home";
import { Missions } from "@/pages/Missions";
import { Shop } from "@/pages/Shop";
import { Profile } from "@/pages/Profile";
import { Recipients } from "@/pages/Recipients";
import { Verify } from "@/pages/Verify";

export default function App() {
  return (
    <>
      <NativeBackButton />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/recipients" element={<Recipients />} />
        </Route>
        <Route path="/verify/:missionId" element={<Verify />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
