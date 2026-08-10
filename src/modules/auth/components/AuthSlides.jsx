import React, { useState, useEffect } from 'react';
import login0 from '../../../assets/Auth.page/login0.svg';
import login1 from '../../../assets/Auth.page/login1.svg';
import login2 from '../../../assets/Auth.page/login2.svg';

const AuthSlides = ({
  autoSlide = true,
  slideInterval = 3000
}) => {
  const images = [login0, login1, login2];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!autoSlide) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, slideInterval);

    return () => clearInterval(interval);
  }, [images.length, slideInterval, autoSlide]);

  return (
    <>

      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden h-full min-h-screen bg-[#FFFFFF]">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center p-8 lg:p-12">
              <img
                src={image}
                alt={`Auth slide ${index + 1}`}
                className="w-full h-full object-contain max-w-full max-h-full"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="lg:hidden w-full h-[45vh] bg-[#FFFFFF] flex flex-col justify-center items-center px-0 py-2">
        <div className="w-full flex-1 flex items-center justify-center px-2 py-1">
          <div className="relative w-full h-full flex items-center justify-center">
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="w-full h-full flex items-center justify-center p-2">
                  <img
                    src={image}
                    alt={`Auth slide ${index + 1}`}
                    className="w-full h-full object-contain max-w-full max-h-full scale-110"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthSlides;
