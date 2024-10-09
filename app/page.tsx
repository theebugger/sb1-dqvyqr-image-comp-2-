import ImageResizer from './components/ImageResizer';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-gradient">Pic Perfecter 3000</h1>
      <p className="text-center mb-8 text-lg">Turn your chonky pics into sleek, share-worthy masterpieces!</p>
      <ImageResizer />
    </main>
  );
}