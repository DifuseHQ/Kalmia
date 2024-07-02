import { initFlowbite } from 'flowbite'
import React, { useEffect } from 'react'

export default function Table({ data }) {
    useEffect(() => {
        // Initialize Flowbite or any other scripts after data updates
        initFlowbite();
    }, [data]); // Include data as a dependency if initialization depends on its updates
console.log(data);
    return (
        <section className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
            <div className="mx-auto max-w-screen-xl px-4 lg:px-12">
                <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
                    {/* Your table structure and rendering of data */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                <th scope="col" class="px-4 py-3">Product name</th>
                            <th scope="col" class="px-4 py-3">Category</th>
                            <th scope="col" class="px-4 py-3">Brand</th>
                            <th scope="col" class="px-4 py-3">Description</th>
                            <th scope="col" class="px-4 py-3">Price</th>
                            <th scope="col" class="px-4 py-3">
                                <span class="sr-only">Actions</span>
                            </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.pageGroups.map((item,index) => (
                                   <tr class="border-b dark:border-gray-700">
                                   <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.name}</th>
                                   <td class="px-4 py-3">PC</td>
                                   <td class="px-4 py-3">Apple</td>
                                   <td class="px-4 py-3">300</td>
                                   <td class="px-4 py-3">$2999</td>
                                   <td class="px-4 py-3 flex items-center justify-end">
                                       <button id="apple-imac-27-dropdown-button" data-dropdown-toggle={index} class="inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100" type="button">
                                           <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                               <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                           </svg>
                                       </button>
                                       <div id={index} class="hidden z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600">
                                           <ul class="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="apple-imac-27-dropdown-button">
                                               <li>
                                                   <a href="#" class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Show</a>
                                               </li>
                                               <li>
                                                   <a href="#" class="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Edit</a>
                                               </li>
                                           </ul>
                                           <div class="py-1">
                                               <a href="#" class="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Delete</a>
                                           </div>
                                       </div>
                                   </td>
                               </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Table navigation or other components */}
                </div>
            </div>
        </section>
    )
}
