import express from 'express';
import { ethers } from 'ethers';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({
  origin: 'http://localhost:3000'
}));

const port = 3001;

// Загрузка ABI
const abiData = JSON.parse(
  await readFile(join(__dirname, 'contracts/DynamicDiscountNFT.json'))
);
const ABI = abiData.abi;

app.get('/api/discount/:address', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);

    // Валидация адреса
    if (!ethers.isAddress(req.params.address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
