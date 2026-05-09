import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWalletClient } from 'wagmi'
import { metaMask, coinbaseWallet } from 'wagmi/connectors'
import { parseEther, formatEther, encodeFunctionData } from 'viem'

const NFT_ADDRESS = '0x1304102eD1cFB644d650D3cD3bA9b366ECf13035'
const NFT_IMAGE = 'https://ipfs.io/ipfs/bafybeihszcqbxhjjcocajlo7tdfaqeh2bop5osuoif7sktc3ln7zyd4pla'

const ABI = [
  { name: 'mint', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'mintPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
]

export default function Mint() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const [minting, setMinting] = useState(false)
  const [txHash, setTxHash] = useState('')

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({ address: NFT_ADDRESS, abi: ABI, functionName: 'totalSupply', chainId: 84532 })
  const { data: maxSupply } = useReadContract({ address: NFT_ADDRESS, abi: ABI, functionName: 'maxSupply', chainId: 84532 })
  const { data: mintPrice } = useReadContract({ address: NFT_ADDRESS, abi: ABI, functionName: 'mintPrice', chainId: 84532 })
  const { data: userBalance, refetch: refetchBalance } = useReadContract({ address: NFT_ADDRESS, abi: ABI, functionName: 'balanceOf', args: [address || '0x0000000000000000000000000000000000000000'], chainId: 84532 })

  const handleMint = async () => {
    try {
      setMinting(true)
      if (!walletClient) throw new Error('Wallet not connected')
      const tx = await walletClient.sendTransaction({
        to: NFT_ADDRESS,
        value: mintPrice || parseEther('0.0001'),
        data: encodeFunctionData({ abi: ABI, functionName: 'mint', args: [] }),
      })
      setTxHash(tx)
      setTimeout(() => { refetchSupply(); refetchBalance() }, 4000)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setMinting(false)
    }
  }

  const progress = totalSupply && maxSupply ? (Number(totalSupply) / Number(maxSupply)) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px rgba(255,100,0,0.2)' }}>
          <img src={NFT_IMAGE} alt="Portugal NFT" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          <div style={{ padding: '32px' }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🏰 Portugal Moments</h1>
            <p style={{ color: '#888', marginBottom: '24px' }}>Pena Palace, Sintra — Limited Edition NFT on Base</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Minted</span>
              <span style={{ color: 'white', fontSize: '0.9rem' }}>{totalSupply?.toString() || '0'} / {maxSupply?.toString() || '100'}</span>
            </div>
            <div style={{ background: '#2a2a2a', borderRadius: '999px', height: '6px', marginBottom: '24px' }}>
              <div style={{ background: '#f97316', borderRadius: '999px', height: '6px', width: `${progress}%`, transition: 'width 0.5s' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ background: '#2a2a2a', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>Price</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{mintPrice ? formatEther(mintPrice) : '0.0001'} ETH</p>
              </div>
              {isConnected && userBalance !== undefined && (
                <div style={{ background: '#2a2a2a', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>You Own</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{userBalance.toString()} NFT{userBalance !== 1n ? 's' : ''}</p>
                </div>
              )}
            </div>

            {!isConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => connect({ connector: metaMask() })} style={{ width: '100%', padding: '14px', background: '#f6851b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  🦊 Connect MetaMask
                </button>
                <button onClick={() => connect({ connector: coinbaseWallet({ appName: 'Portugal NFT' }) })} style={{ width: '100%', padding: '14px', background: '#0052ff', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  🔵 Connect Coinbase Wallet
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleMint} disabled={minting}
                  style={{ width: '100%', padding: '16px', background: minting ? '#333' : 'linear-gradient(135deg, #f97316, #ef4444)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: minting ? 'not-allowed' : 'pointer' }}>
                  {minting ? 'Minting...' : '🏰 Mint NFT'}
                </button>

                {txHash && (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#00ff88', fontSize: '0.85rem' }}>Minted! 🎉</p>
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
    </div>
  )
}