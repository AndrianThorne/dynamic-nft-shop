import express from 'express';
import { ethers } from 'ethers';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
const port = 3001;

// Загрузка ABI
const abiData = JSON.parse(
  await readFile(join(__dirname, 'contracts/DynamicDiscountNFT.json'))
);
const ABI = abiData.abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

app.get('/api/discount/:address', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const balance = await contract.balanceOf(req.params.address);
    let totalDiscount = 0;

    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(req.params.address, i);
      const discount = await contract.calculateDiscount(tokenId);
      totalDiscount += Number(discount);
    }

    res.json({
      discount: Math.min(totalDiscount, 20),
      nftCount: balance.toString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API сервер запущен на http://localhost:${port}`);
});