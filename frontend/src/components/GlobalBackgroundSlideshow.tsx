import React from 'react';

const GlobalBackgroundSlideshow: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <style>{`
                /* Seamless fade animation: Always overlapping to prevent background color showing */
                @keyframes cross-fade {
                    0% { opacity: 0; }
                    5% { opacity: 1; }
                    30% { opacity: 1; }
                    35% { opacity: 0; }
                    100% { opacity: 0; }
                }
                .slideshow-img {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    width: 100%;
                    height: 100%;
                    transition: transform 10s linear;
                    opacity: 0;
                }
                /* Base layer image to ensure there is NEVER a gap/color in the back */
                .img-base {
                    opacity: 1;
                    z-index: 1;
                }
                @media (max-width: 768px) {
                    .slideshow-img {
                        background-position: center 20%;
                    }
                }
                /* Animation for 4 images: 20s total loop, 5s per stage */
                .img-1 { animation: cross-fade 20s infinite 0s; z-index: 5; }
                .img-2 { animation: cross-fade 20s infinite 5s; z-index: 4; }
                .img-3 { animation: cross-fade 20s infinite 10s; z-index: 3; }
                .img-4 { animation: cross-fade 20s infinite 15s; z-index: 2; }
            `}</style>

            {/* Base Image - Always present to prevent blue background flicker */}
            <div className="slideshow-img img-base" style={{
                backgroundImage: 'url(https://imkarchitects.com/images/projects/institutional/sona-college-of-arts-and-science/2.jpg)'
            }}></div>

            {/* Animated Layers */}
            <div className="slideshow-img img-1" style={{
                backgroundImage: 'url(https://imkarchitects.com/images/projects/institutional/sona-college-of-arts-and-science/2.jpg)'
            }}></div>
            <div className="slideshow-img img-2" style={{
                backgroundImage: 'url(https://www.sonatech.ac.in/eee/rteec22/statics/img/slider/slider2.jpg)'
            }}></div>
            <div className="slideshow-img img-3" style={{
                backgroundImage: 'url(https://www.sonatech.ac.in/photo-gallery/campus/images/college-entrance.jpg)'
            }}></div>
            <div className="slideshow-img img-4" style={{
                backgroundImage: 'url(https://www.sonatech.ac.in/photo-gallery/campus/images/main-building-inner-view.jpg)'
            }}></div>

            {/* Crystal clear overlay - no blur, very subtle darkening for text legibility */}
            <div className="absolute inset-0 bg-black/20 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-10"></div>
        </div>
    );
};

export default GlobalBackgroundSlideshow;

