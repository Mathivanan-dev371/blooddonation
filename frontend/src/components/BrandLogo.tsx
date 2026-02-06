import React from 'react';

const BrandLogo: React.FC<{ className?: string }> = ({ className = "h-12 w-auto" }) => {
    return (
        <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxCVlG79rKEJQ539wivTfd3gEkRu-yYkkOM-KA8SwIZOefoF9REmwgwiTg"
            alt="Sona Group of Institutions"
            className={`${className} cursor-pointer hover:opacity-90 transition-opacity object-contain`}
            onClick={() => window.location.href = '/'}
            onError={(e) => {
                // Fallback to local if URL fails
                (e.target as HTMLImageElement).src = "/images/sona_logo.png";
            }}
        />
    );
};

export default BrandLogo;
