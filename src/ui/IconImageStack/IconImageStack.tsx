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
      {visibleImages.map((img, i) => (
        <img
          key={i}
          src={img.thumbnail}
          alt={img.fileName}
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
