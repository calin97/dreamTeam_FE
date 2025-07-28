import React from "react";
import { Container, Typography, ListItemText, ListItem, Skeleton } from "@mui/material";
import { Link } from "react-router-dom";
import useWallet from "src/hooks/useWallet";
import useBalances from "src/hooks/useBalances";
import useDecimals from "src/hooks/useDecimals";
import { toEth } from "src/utils/common";
import { dismissNotifyAll, notifyError, notifyLoading, notifySuccess } from "src/api/notifications";
import { Button } from "src/components/ui/button";

interface IProps {}

const Home: React.FC<IProps> = () => {
  const { balance, displayAccount, currentAddress } = useWallet();
  const { balances, isLoading, isFetching } = useBalances();
  const { decimals } = useDecimals();

  return (
    <Container maxWidth="xl">
      <h1>Root Page</h1>
      <Typography>
        <b>Balance:</b> {balance?.formatted}
      </Typography>
      <Typography>
        <b>Current Wallet:</b> {currentAddress}
      </Typography>
      <Typography>
        <b>Current Wallet:</b> {displayAccount}
      </Typography>
      <Link to="/test">Test</Link>
      <Typography variant="h5">Balances:-</Typography>
      {balances &&
        !isLoading &&
        Object.entries(balances).map(([address, balance]) => (
          <ListItem key={address}>
            <ListItemText>
              <b>Address:</b> {address} <b>Balance:</b> {toEth(balance, decimals && decimals[address])}
            </ListItemText>
          </ListItem>
        ))}
      {isFetching && <Skeleton height={200} />}

      <Button>cevaaaaaaaaaaaaa</Button>
    </Container>
  );
};

export default Home;
