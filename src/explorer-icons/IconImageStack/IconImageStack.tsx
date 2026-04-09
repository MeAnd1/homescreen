import "./IconImageStack.css";

interface IconImageStackProps {
  images: string[];
  alt?: string;
  size?: number;
}

function IconImageStack({ images, alt = "", size = 64 }: IconImageStackProps) {
  const visibleImages = images.slice(0, 3);
  const rotations = [-6, 5, 0];
  const count = visibleImages.length;

  return (
    <div className="icon-image-stack" style={{ width: size, height: size }}>
      {visibleImages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={alt}
          className="icon-image-stack-img"
          style={{
            zIndex: i,
            transform: `rotate(${rotations[i + (3 - count)]}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default IconImageStack;
