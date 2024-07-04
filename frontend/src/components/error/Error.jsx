import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Error() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // Navigates back to the previous page in history
  };

  return (
    <section class="bg-neutral-300 dark:bg-gray-900 h-screen">
    <div class=" py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div class="mx-auto max-w-screen-sm text-center">
            <h1 class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-gray-900 dark:text-gray-900">404</h1>

            <p class="mb-4 text-3xl tracking-tight font-bold text-gray-600 md:text-4xl dark:text-white">Sorry, we couldn't find this page.</p>
            <button onClick={goBack} class="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">Back to previous page</button>
        </div>   
    </div>
</section>
  );
}
