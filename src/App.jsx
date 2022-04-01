import { useState } from 'react';
// import './App.css'
import './index.css';
import { Navbar, Welcome, Services, Transactions, Footer } from './components/index';
import { TransactionProvider } from './context/TransactionContext';

function App() {
  const [count, setCount] = useState(0)

  return (
    <TransactionProvider>
      <div className="App">
        <div className='min-h-screen'>
          <div className='gradient-bg-welcome'>
            <Navbar />
            <Welcome />
          </div>
          <Services />
          <Transactions />
          <Footer />
        </div>
      </div>
    </TransactionProvider>
  )
}

export default App;
