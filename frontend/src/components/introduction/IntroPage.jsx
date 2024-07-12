import React from "react";

export default function IntroPage() {
  return (
    <div className="w-auto h-screen dark:dark:bg-gray-900">
      <div className="flex flex-col items-center p-10 mx-auto w-3/4 dark:text-white">
        <h1 className="text-4xl font-bold mb-14 text-md font-sans">
          Welcome to Content Management System <span>(</span>CMS<span>)</span>
        </h1>
        <p className="text-lg font-medium">
          Welcome to our Content Management System! Our CMS is designed to make
          managing and publishing your content easy and efficient. Whether you
          are a small business, a large enterprise, or an individual blogger,
          our CMS provides the tools you need to create, manage, and distribute
          your content seamlessly.
        </p>
      </div>
    </div>
  );
}
