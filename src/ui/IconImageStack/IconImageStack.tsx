import "./IconImageStack.css";

interface IconImageStackProps {
  images: { thumbnail: string; full: string; fileName: string }[];
  alt?: string;
  size?: number;
}

function IconImageStack({ images, size = 64 }: IconImageStackProps) {
  const visibleImages = images.slice(0, 3);
  const rotations = [-6, 5, 0];
  const count = visibleImages.length;

  return (
    <div className="icon-image-stack" style={{ width: size, height: size }}>
      {visibleImages.map((image, index) => (
        <img
          key={index}
          src={image.thumbnail}
          alt={image.fileName}
          className="icon-image-stack-img"
          style={{
            zIndex: index,
            transform: `rotate(${rotations[index + (3 - count)]}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default IconImageStack;
