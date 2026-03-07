import { useEffect } from "react";
import Scrollbar from 'smooth-scrollbar';


const SCROLLBAR_OPTIONS = {
    damping: 0.7,
};

const CustomScrollbar = () => {

    useEffect(() => {
      Scrollbar.init(document.querySelector('.customScrollbar')!, SCROLLBAR_OPTIONS);
    }, [])
 return null;
}

export default CustomScrollbar