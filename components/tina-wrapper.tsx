'use client';

import { useTina } from 'tinacms/dist/react';

interface TinaHeaderProps {
  query: string;
  variables: { relativePath: string };
  data: {
    docs?: {
      title?: string;
      description?: string;
      draft?: boolean;
    };
  };
  fallbackTitle: string;
  fallbackDescription?: string;
}

export function TinaHeader({
  query,
  variables,
  data: initialData,
  fallbackTitle,
  fallbackDescription,
}: TinaHeaderProps) {
  const { data } = useTina({
    query,
    variables,
    data: initialData,
  });

  const title = data?.docs?.title || fallbackTitle;
  const description = data?.docs?.description || fallbackDescription;

  return (
    <div>
      {description ? (
        <p className="mb-4 text-base text-fd-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
