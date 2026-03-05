export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <main className="page-wrapper" role="main">
      <div className="page-inner">
        <h1>Product: {params.id}</h1>
        <p>Live deployed product page placeholder.</p>
      </div>
    </main>
  );
}
