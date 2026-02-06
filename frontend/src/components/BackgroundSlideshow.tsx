const BackgroundSlideshow = () => {
    const images = [
        'https://i.postimg.cc/Kz8hQdYP/college4.jpg',
        'https://i.postimg.cc/VkjGYqLZ/college2.jpg',
        'https://i.postimg.cc/MKmLkCfD/college1.jpg',
        'https://www.sonatech.ac.in/photo-gallery/campus/images/college-entrance.jpg'
    ];

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-slate-900">
            <div className="absolute inset-0">
                {images.map((img, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 bg-cover bg-center opacity-0 animate-ken-burns"
                        style={{
                            backgroundImage: `url(${img})`,
                            animationDelay: `${i * 10}s`,
                            animationDuration: `${images.length * 10}s`
                        }}
                    ></div>
                ))}
            </div>
            {/* Dark gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 backdrop-blur-[2px]"></div>

            <style>{`
                @keyframes ken-burns {
                    0% {
                        opacity: 0;
                        transform: scale(1) translate(0, 0);
                    }
                    5% {
                        opacity: 1;
                    }
                    25% {
                        opacity: 1;
                    }
                    30% {
                        opacity: 0;
                        transform: scale(1.1) translate(-2%, -2%);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.1) translate(-2%, -2%);
                    }
                }
                .animate-ken-burns {
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform, opacity;
                }
            `}</style>
        </div>
    );
};

export default BackgroundSlideshow;
