import argparse
parser = argparse.ArgumentParser()
parser.add_argument("square", help="base and exponent (default 2)", nargs='?')
parser.add_argument("-v","--verbose", help="print specific outputs", action="store_true")
args = parser.parse_args()
#if args.verbose:
	#print(int(args.square[0]),"^",int(args.square[1]),"= ",end="")
print(args.square)

#print(args.square**args.square)

