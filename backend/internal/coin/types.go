package coin

type CoinService struct{}

type GetBlockCountArgs struct{}
type GetBlockCountReply struct {
	Count int64 `json:"count"`
}
