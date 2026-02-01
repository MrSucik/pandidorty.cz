import { useState } from "react";

function GalleryImage({ path, index }: { path: string; index: number }) {
	const [loaded, setLoaded] = useState(false);

	return (
		<div
			className={`masonry-item relative rounded-lg overflow-hidden ${
				loaded ? "" : "bg-gray-200 animate-pulse aspect-[3/4]"
			}`}
			style={{ contain: "layout style paint" }}
		>
			<img
				src={path}
				alt={`Dort ${index + 1}`}
				loading="lazy"
				decoding="async"
				onLoad={() => setLoaded(true)}
				className={`w-full h-auto rounded-lg block transition-opacity duration-300 hover:scale-[1.02] ${
					loaded ? "opacity-100" : "opacity-0 absolute inset-0"
				}`}
			/>
		</div>
	);
}

export default function Gallery() {
	// Get all images from 1-199 that exist in the gallery directory
	const images = Array.from({ length: 199 }, (_, i) => i + 1)
		.map((num) => {
			// Skip images #18, #24, and #183 explicitly to maintain the numbering sequence
			if (num === 18 || num === 24 || num === 183) {
				return null;
			}

			const path = `/gallery/${num}.webp`;
			return path;
		})
		.filter(Boolean) as string[];

	return (
		<div className="min-h-screen relative">
			<div className="absolute inset-0 max-w-7xl mx-auto left-0 right-0 overflow-hidden">
				<div className="bg-flowers h-full w-full -z-10" />
			</div>

			<div className="min-h-screen pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto relative">
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm">
					<h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
						Galerie
					</h1>

					<div className="masonry-grid">
						{images.map((path, index) => (
							<GalleryImage key={path} path={path} index={index} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
