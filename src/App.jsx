import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useReadContract, useWalletClient } from 'wagmi'
import { coinbaseWallet, metaMask } from 'wagmi/connectors'
import { parseEther, formatEther, encodeFunctionData } from 'viem'

const CONTRACT_ADDRESS = '0xD6Eaa2053Fd592185211d514Ed70cF8dF26EBbF8'

const ABI = [
  { name: 'tip', type: 'function', stateMutability: 'payable', inputs: [{ name: 'message', type: 'string' }], outputs: [] },
  { name: 'getTips', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'tuple[]', components: [{ name: 'from', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'message', type: 'string' }, { name: 'timestamp', type: 'uint256' }] }] },
]

function App() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('0.0001')
  const [txHash, setTxHash] = useState('')
  const [sending, setSending] = useState(false)

  const { data: balance, refetch: refetchBalance } = useBalance({ address: CONTRACT_ADDRESS, chainId: 8453 })
  const { data: tipHistory, refetch: refetchTips } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'getTips', chainId: 8453 })

  const handleTip = async () => {
    try {
      setSending(true)
      if (!walletClient) throw new Error('Wallet not connected')
      const tx = await walletClient.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: parseEther(amount),
        data: encodeFunctionData({ abi: ABI, functionName: 'tip', args: [message || ''] }),
      })
      setTxHash(tx)
      setSending(false)
      setTimeout(() => { refetchBalance(); refetchTips() }, 4000)
    } catch (err) {
      setSending(false)
      alert('Error: ' + err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '40px', boxShadow: '0 0 40px rgba(0,82,255,0.2)', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>☕ Tip Jar</h1>
          <p style={{ color: '#888', marginBottom: '32px' }}>Send a tip on Base Mainnet</p>

          {balance && (
            <div style={{ background: '#0052ff22', border: '1px solid #0052ff44', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
              <p style={{ margin: 0, color: '#0052ff', fontSize: '0.9rem' }}>Contract Balance</p>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{parseFloat(balance.formatted).toFixed(6)} ETH</p>
            </div>
          )}

          {!isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => connect({ connector: metaMask() })} style={{ width: '100%', padding: '14px', background: '#f6851b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                🦊 Connect MetaMask
              </button>
              <button onClick={() => connect({ connector: coinbaseWallet({ appName: 'Tip Jar' }) })} style={{ width: '100%', padding: '14px', background: '#0052ff', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                🔵 Connect Coinbase Wallet
              </button>
            </div>
          ) : (
            <>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '24px' }}>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Amount (ETH)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.0001"
                  style={{ width: '100%', padding: '12px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Message (optional)</label>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Great work!"
                  style={{ width: '100%', padding: '12px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <button onClick={handleTip} disabled={sending}
                style={{ width: '100%', padding: '14px', background: sending ? '#333' : '#0052ff', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: sending ? 'not-allowed' : 'pointer' }}>
                {sending ? 'Sending...' : `Send ${amount} ETH ☕`}
              </button>

              {txHash && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#00ff88', fontSize: '0.85rem' }}>Tip sent! 🎉</p>
                  <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: '#00ff88', fontSize: '0.8rem' }}>View on Basescan →</a>
                </div>
              )}

              <button onClick={() => disconnect()} style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'transparent', border: '1px solid #333', borderRadius: '10px', color: '#888', fontSize: '0.9rem', cursor: 'pointer' }}>
                Disconnect
              </button>
            </>
          )}
        </div>

        {tipHistory && tipHistory.length > 0 && (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', boxShadow: '0 0 40px rgba(0,82,255,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#aaa' }}>📜 Tip History ({tipHistory.length})</h2>
            {[...tipHistory].reverse().map((t, i) => (
              <div key={i} style={{ borderBottom: '1px solid #2a2a2a', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0052ff', fontSize: '0.85rem' }}>{t.from.slice(0, 6)}...{t.from.slice(-4)}</span>
                  <span style={{ fontWeight: 'bold', color: '#00ff88' }}>{parseFloat(formatEther(t.amount)).toFixed(6)} ETH</span>
                </div>
                {t.message && <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>"{t.message}"</p>}
                <p style={{ margin: '2px 0 0', color: '#555', fontSize: '0.75rem' }}>{new Date(Number(t.timestamp) * 1000).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App