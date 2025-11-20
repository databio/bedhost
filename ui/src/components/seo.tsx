import { FC } from 'react';
import { Helmet } from 'react-helmet-async';

interface Props {
  title?: string;
  description?: string;
  image?: string;
}

export const SEO: FC<Props> = ({ title, description, image }) => {
  const pageTitle = title || 'BEDbase';
  const pageDescription =
    description || 'BEDbase is a unified platform for aggregating, analyzing, and serving genomic region data.';
  const pageImage = image || '';
  const pageUrl = 'https://bedbase.org/';
  const pageType = 'website';
  return (
    <Helmet>
      {/*  general */}
      <title>{pageTitle}</title>
      <meta name='description' content={pageDescription} />
      <meta name='author' content='databio' />
      {/* favicon */}
      <link rel='icon' type='image/svg+xml' href='/favicon.ico' />

      {/*  open graph */}
      <meta property='og:type' content={pageType} />
      <meta name='description' property='og:description' content={pageDescription} />
      <meta name='title' property='og:title' content={pageTitle} />
      <meta name='image' property='og:image' content={pageImage} />
      <meta property='og:type' content={pageType} />
      <meta property='og:url' content={pageUrl} />

      {/*  twitter card */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:site' content='@shefflab' />
      <meta name='twitter:creator' content='@shefflab' />
      <meta name='twitter:title' content={pageTitle} />
      <meta name='twitter:description' content={pageDescription} />
      <meta name='twitter:image' content={pageImage} />
    </Helmet>
  );
};
