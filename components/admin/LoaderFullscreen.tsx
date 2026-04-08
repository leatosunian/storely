import React from "react";

const LoaderFullscreen = () => {
  return (
    <>
      <div
        className="fixed flex items-center border-none justify-center w-full h-full overflow-y-hidden bg-background"
        style={{ zIndex: "99999999" }}
      >
        <div className=" loader"></div>
      </div>
    </>
  );
};
export default LoaderFullscreen;
