"use client";

import InteractiveAvatar, { InteractiveAvatar as InnerAvatar } from "@/components/InteractiveAvatar";
import Recorder from "@/components/Recorder";
import { StreamingAvatarProvider } from "@/components/logic";
import UserInfoGate from "@/components/UserInfoGate";
export default function App() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-[900px] flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <UserInfoGate>
          <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
            <div className="w-full">
              <InnerAvatar />
            </div>
            {/* <div className="w-full">
              <Recorder />
            </div> */}
          </StreamingAvatarProvider>
        </UserInfoGate>
      </div>
    </div>
  );
}


