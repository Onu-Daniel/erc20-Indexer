import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
// import Web3Modal from 'web3modal';

// create a Web3Provider instance using the user's browser window.ethereum
const provider = new ethers.providers.Web3Provider(window.ethereum);

// create a Signer instance using the provider instance
const signer = provider.getSigner();

function App() {
  // set up state variables
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addressError, setAddressError] = useState("");

  // function to retrieve ERC-20 token balances for a given address
  async function getTokenBalance() {
    setIsLoading(true);
  
    // check if the entered address has a reverse resolution in ENS
    if (!await provider.resolveName(userAddress)) {
      setAddressError("Invalid address. Please enter a valid Ethereum address or ENS name.");
      setIsLoading(false);
      return;
    }
    
    // check if the entered address is valid
    if (!ethers.utils.isAddress(userAddress)) {
      setAddressError("Invalid address. Please enter a valid Ethereum address.");
      setIsLoading(false);
      return;
    }
    
    

    // create an Alchemy SDK instance using the Alchemy API key and Ethereum network
    const config = {
      apiKey: "d8Ui9YwwAxq51F_OMXkUvT_GZ5z-h7m4",
      network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);

    // retrieve token balances for the given address
    const data = await alchemy.core.getTokenBalances(userAddress);
    setResults(data);

    // retrieve token metadata for each token
    const tokenDataPromises = [];
    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }
    setTokenDataObjects(await Promise.all(tokenDataPromises));

    // update state variables to indicate that results have been fetched
    setHasQueried(true);
    setIsLoading(false);
  }

  // function to prompt the user to connect their Ethereum wallet
  async function connectWallet() {
    try {
      await window.ethereum.enable();
    } catch (e) {
      console.error(e);
    }
  }

  // use the useEffect hook to get the user's Ethereum address and set it as a state variable
  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
      }
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setUserAddress(accounts[0]);
      });
      getAccounts();
    }
  }, []);

  // return the React component
  return (
    <Box w="100vw">
      <Center>    
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          value={userAddress}
          onChange={(e) => {
            setUserAddress(e.target.value);
            setAddressError("");
          }}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        {addressError && <Text color="red">{addressError}</Text>}

        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Button fontSize={15} mt={36} bgColor="red" onClick={connectWallet}>
          Connect to a Wallet
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {isLoading ? (
          <div className="parentload">
            <div className="loader"></div>
          </div>
        ) : hasQueried ? (
          <SimpleGrid w={"90vw"} columns={5} spacing={30}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={"column"}
                  color="white"
                  bg="#0B0B45"
                  w={"15vw"}
                  h={'19vw'}
                  style={{
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
                  }}
                  key={e.id}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {(
                      Math.round(Utils.formatUnits(
                        e.tokenBalance,
                        tokenDataObjects[i].decimals
                      ) * 10000) / 10000
                    ).toFixed(4).toString().substring(0, 12)}
                  </Box>


                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          "Please make a query! This may take a few seconds..."
        )}
      </Flex>
    </Box>
  );
}

export default App;
