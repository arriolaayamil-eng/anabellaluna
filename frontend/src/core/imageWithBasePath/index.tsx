
import { img_path } from '../../environment';
import { API_BASE_URL } from '../../config/api';


interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?:string;
}

const ImageWithBasePath = (props: Image) => {
  // Combine the base path and the provided src to create the full image source URL
  const src = String(props.src || "");
  const isBackendPublicPath = src.startsWith("/public/");
  const isAbsolute =
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("//");

  const fullSrc = isAbsolute
    ? src
    : isBackendPublicPath
    ? `${API_BASE_URL}${src}`
    : src.startsWith("/")
    ? src
    : `${img_path}${src}`;
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
    />
  );
};

export default ImageWithBasePath;
