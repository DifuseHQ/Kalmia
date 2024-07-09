import React from 'react';
import { Link } from 'react-router-dom';

export default function Error500() {
  return (
    <section style={{backgroundImage:`url('/assets/na_january_16.jpg')`,backgroundPosition:"center center",backgroundsSize: "cover" }} className="min-h-screen flex justify-center items-center gap-10 px-10 bg-no-repeat bg-cover bg-center bg-blend-multiply">
      <div className="m-10">
        <div className="max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-7xl text-gray-900 dark:text-gray-900 text-left">500 <span className='text-gray-900 lg:text-5xl'>Server Error</span></h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-700 md:text-3xl text-center">Oops, something Went Wrong.</p>
          <Link to="/" class="inline-flex gap-2 items-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-semibold rounded-lg text-md px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">
          <svg fill="#ffffff" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 30 30" >
        <path d="M 15 3 C 12.053086 3 9.3294211 4.0897803 7.2558594 5.8359375 A 1.0001 1.0001 0 1 0 8.5449219 7.3652344 C 10.27136 5.9113916 12.546914 5 15 5 C 20.226608 5 24.456683 8.9136179 24.951172 14 L 22 14 L 26 20 L 30 14 L 26.949219 14 C 26.441216 7.8348596 21.297943 3 15 3 z M 4.3007812 9 L 0.30078125 15 L 3 15 C 3 21.635519 8.3644809 27 15 27 C 17.946914 27 20.670579 25.91022 22.744141 24.164062 A 1.0001 1.0001 0 1 0 21.455078 22.634766 C 19.72864 24.088608 17.453086 25 15 25 C 9.4355191 25 5 20.564481 5 15 L 8.3007812 15 L 4.3007812 9 z"></path>
        </svg>
             Reload</Link>
        </div>
      </div>
    
    </section>
  );
}
