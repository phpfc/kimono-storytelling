import { ArrowLeftCircle, ArrowRightCircle, Circle, CircleDot } from "lucide-react"
import { useState } from "react"

export default function Slider({slides}:{slides: React.ReactNode[]}) {

    const [currentSlide, setCurrentSlide] = useState(0)

    const previousSlide = () => {
        if (currentSlide === 0) {
            setCurrentSlide(slides.length - 1)
        } else {
            setCurrentSlide(currentSlide - 1)
        }
    }

    const nextSlide = () => {
        if (currentSlide === slides.length - 1) {
            setCurrentSlide(0)
        } else {
            setCurrentSlide(currentSlide + 1)
        }
    }


    return (
        <div className="slider">
            {slides[currentSlide]}
            <button onClick={previousSlide} className="slider-bttn prev">
                <ArrowLeftCircle />
            </button>
            <div className="slider-selector">
                {slides.map((_, index) => (
                    <button key={index} className={`slider-select`} onClick={() => setCurrentSlide(index)}>
                        {
                            index === currentSlide ? <CircleDot /> : <Circle />
                        }
                    </button>
                ))}
            </div>
            <button onClick={nextSlide} className="slider-bttn next">
                <ArrowRightCircle />
            </button>
        </div>
    )
}