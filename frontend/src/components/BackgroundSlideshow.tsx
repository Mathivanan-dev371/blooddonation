const BackgroundSlideshow = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden">
            <div className="slideshow-container">
                <div className="slide" style={{ backgroundImage: 'url(https://i.postimg.cc/Kz8hQdYP/college4.jpg)' }}></div>
                <div className="slide" style={{ backgroundImage: 'url(https://i.postimg.cc/VkjGYqLZ/college2.jpg)' }}></div>
                <div className="slide" style={{ backgroundImage: 'url(https://i.postimg.cc/MKmLkCfD/college1.jpg)' }}></div>
                {/* Removed broken college3.jpg */}
                <div className="slide" style={{ backgroundImage: 'url(https://i.postimg.cc/Kz8hQdYP/college4.jpg)' }}></div>
            </div>
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm"></div>
            <style>{`
                .slideshow-container {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                }
                .slide {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    opacity: 0;
                    animation: slideshow 20s infinite;
                }
                .slide:nth-child(1) { animation-delay: 0s; }
                .slide:nth-child(2) { animation-delay: 5s; }
                .slide:nth-child(3) { animation-delay: 10s; }
                .slide:nth-child(4) { animation-delay: 15s; }
                @keyframes slideshow {
                    0%, 20% { opacity: 1; }
                    25%, 100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default BackgroundSlideshow;
