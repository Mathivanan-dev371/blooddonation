import React from 'react';

const GlobalBackgroundSlideshow: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <style>{`
                @keyframes cross-fade {
                    0%, 20% { opacity: 1; }
                    25%, 100% { opacity: 0; }
                }
                .slideshow-img {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    z-index: 0;
                    width: 100%;
                    height: 100%;
                }
                @media (max-width: 768px) {
                    .slideshow-img {
                        background-position: center 20%; /* Better for mobile to see the top part of the image */
                    }
                }
                /* Animation for 4 images: 24s total loop, 6s per image */
                .img-1 { animation: cross-fade 24s infinite 0s; z-index: 4; }
                .img-2 { animation: cross-fade 24s infinite 6s; z-index: 3; }
                .img-3 { animation: cross-fade 24s infinite 12s; z-index: 2; }
                .img-4 { animation: cross-fade 24s infinite 18s; z-index: 1; }
            `}</style>

            <div className="slideshow-img img-1" style={{ backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhR6aigXwj2jbmY-USWZCWDrjVX0xaZTYsJfX69BxFfgI5-CEFJEMEneg)' }}></div>
            <div className="slideshow-img img-2" style={{ backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZS8lQAt52BfwWkUXJtkbwcUZDeLMnjuUNxhpCDdDqqa9dbU3AfQmvOHDm)' }}></div>
            <div className="slideshow-img img-3" style={{ backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqhnlgFYSbxS6RrsvWDZhqw_OQcQFLm_vfz_q1VYAGgAIpPocGuHoIUog)' }}></div>
            <div className="slideshow-img img-4" style={{ backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7LuYmGhG75d7XcgYWugueI97iVOuX0otyTIt7lPnK9HDe2_ze2-XxY5A)' }}></div>

            {/* Crystal clear overlay - subtle darkening for text readability across all portals */}
            <div className="absolute inset-0 bg-black/15"></div>
        </div>
    );
};

export default GlobalBackgroundSlideshow;
