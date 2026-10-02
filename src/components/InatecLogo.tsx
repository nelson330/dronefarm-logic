import React from 'react';

interface InatecLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

export const InatecLogo: React.FC<InatecLogoProps> = ({
  className = 'w-full max-w-[280px] h-auto object-contain',
  alt = 'INATEC - Tecnológico Nacional',
}) => {
  return (
    <img
      src={`${import.meta.env.BASE_URL}inatec_tecnologico_nacional.svg`}
      alt={alt}
      className={className}
      draggable={false}
      loading="eager"
    />
  );
};
