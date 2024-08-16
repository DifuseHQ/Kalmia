import React from 'react';
import { Helmet } from 'rspress/runtime';
import { usePageData } from 'rspress/runtime';

interface MetaData {
  title: string;
  description: string;
  image: string;
}

interface MetaProps {
  rawJson: string;
}

export const Meta: React.FC<MetaProps> = ({ rawJson }) => {
  const pageData = usePageData();

  let title: string, description: string, image: string;

  try {
    const parsedJson: MetaData = JSON.parse(rawJson);
    title = parsedJson.title + " - " + pageData.page.title;
    description = parsedJson.description;
    image = parsedJson.image;
  } catch (error) {
    title = '';
    description = '';
  }

  return (
    <Helmet>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
    </Helmet>
  );
}

export default Meta;