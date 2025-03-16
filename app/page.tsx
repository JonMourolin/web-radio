import SimplePlayer from './components/SimplePlayer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Web Radio</h1>
          <p className="text-gray-600">Votre radio en ligne</p>
        </header>
        
        <SimplePlayer />
      </div>
    </main>
  )
}
