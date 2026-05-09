import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWalletClient } from 'wagmi'
import { metaMask, coinbaseWallet } from 'wagmi/connectors'
import { formatEther, parseEther, encodeFunctionData } from 'viem'

const TOKEN_ADDRESS = '0xb97DB768693c913F1C27c847558E9783B1C97e91'

const ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
]

export default function Token() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState('')

  const { data: totalSupply } = useReadContract({ address: TOKEN_ADDRESS, abi: ABI, functionName: 'totalSupply', chainId: 84532 })
  const { data: balance, refetch: refetchBalance } = useReadContract({ address: TOKEN_ADDRESS, abi: ABI, functionName: 'balanceOf', args: [address || '0x0000000000000000000000000000000000000000'], chainId: 84532 })

  const handleSend = async () => {
    try {
      setSending(true)
      if (!walletClient) throw new Error('Wallet not connected')
      const tx = await walletClient.sendTransaction({
        to: TOKEN_ADDRESS,
        data: encodeFunctionData({ abi: ABI, functionName: 'transfer', args: [sendTo, parseEther(sendAmount)] }),
      })
      setTxHash(tx)
      setTimeout(() => refetchBalance(), 4000)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const formatTokens = (val) => val ? Number(formatEther(val)).toLocaleString() : '0'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '40px', boxShadow: '0 0 40px rgba(0,200,100,0.15)', marginBottom: '20px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '3rem' }}>⚽</div>
            <div>
              <h1 style={{ fontSize: '1.8rem', margin: 0 }}>World Cup Token</h1>
              <p style={{ color: '#00ff88', margin: 0, fontSize: '0.9rem' }}>$WCT • Base Sepolia</p>
            </div>
          </div>
          <p style={{ color: '#888', marginBottom: '32px' }}>Total Supply: {formatTokens(totalSupply)} WCT</p>

          {!isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => connect({ connector: metaMask() })} style={{ width: '100%', padding: '14px', background: '#f6851b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                🦊 Connect MetaMask
              </button>
              <button onClick={() => connect({ connector: coinbaseWallet({ appName: 'WCT' }) })} style={{ width: '100%', padding: '14px', background: '#0052ff', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                🔵 Connect Coinbase Wallet
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: '#00ff8811', border: '1px solid #00ff8833', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#00ff88', fontSize: '0.9rem' }}>Your Balance</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{formatTokens(balance)} WCT</p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.8rem' }}>{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Send to Address</label>
                <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="0x..."
                  style={{ width: '100%', padding: '12px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Amount (WCT)</label>
                <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="100"
                  style={{ width: '100%', padding: '12px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              <button onClick={handleSend} disabled={sending || !sendTo || !sendAmount}
                style={{ width: '100%', padding: '14px', background: sending ? '#333' : 'linear-gradient(135deg, #00ff88, #0052ff)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: sending ? 'not-allowed' : 'pointer' }}>
                {sending ? 'Sending...' : '⚽ Send WCT'}
              </button>

              {txHash && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#00ff88', fontSize: '0.85rem' }}>Tokens sent! 🎉</p>
                  <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: '#00ff88', fontSize: '0.8rem' }}>View on Basescan →</a>
                </div>
              )}

              <button onClick={() => disconnect()} style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'transparent', border: '1px solid #333', borderRadius: '10px', color: '#888', fontSize: '0.9rem', cursor: 'pointer' }}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}