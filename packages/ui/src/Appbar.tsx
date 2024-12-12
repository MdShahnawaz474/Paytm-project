import { Button } from "./button";
import Link from "next/link";
interface AppbarProps {
  user?: {
    name?: string | null;
  };
  // TODO: can u figure out what the type should be here?
  onSignin: any;
  onSignout: any;
}

export const Appbar = ({ user, onSignin, onSignout }: AppbarProps) => {
  return (
    <nav className="fixed z-50 w-full flex justify-between border-b bg-white px-4 border-slate-300">

      <div className=" mt-4 text-[#002E6E] text-xl font-bold  flex  justify-center">
        <Link href="/dashboard">
          {" "}
          Paytm <span className="text-[#00B9F1]">Wallet</span>
        </Link>
      </div>
      <div className="flex flex-col justify-center  pt-2">
        <Button onClick={user ? onSignout : onSignin}>
          {user ? "Logout" : "Login"}
        </Button>
      </div>
    </nav>
  );
};
