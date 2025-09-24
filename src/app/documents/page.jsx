"use client"
import React, { Suspense } from 'react';
import DocumentPage from '../../components/DocumentPage/DocumentPage';
import Header from '../../components/Header/Header';
import {useLanguage} from "../../context/LanguageContext";

function DocumentPageLoading() {

    const {t} = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <Header />
      <div className="p-8 px-15 max-w-full mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{t.loading}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function page() {
  return (
    <Suspense fallback={<DocumentPageLoading />}>
      <div className='min-h-screen min-w-full'>
        <DocumentPage />
      </div>
    </Suspense>
  );
}

export default page;