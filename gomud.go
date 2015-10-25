package main

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/avesanen/ansi"
	"github.com/avesanen/websocks"
	"github.com/zenazn/goji"
)

const (
	ZONESIZE = 8
)

func main() {
	server := websocks.NewServer()

	server.OnConnect(func(c *websocks.Conn) {
		h := 24
		w := 80

		view := ansi.NewWindow()
		view.W = w
		view.H = h

		buf := ansi.NewCanvas(w, h)
		view.Draw = buf

		conBuf := ansi.NewBuffer(view)

		msg := websocks.Msg{}
		msg.Type = "ascii"
		msg.Message = conBuf.Refresh()
		c.Send(msg)

		for {
			<-time.After(time.Second / 30)
			for n := 0; n < 12000; n++ {
				x := rand.Intn(w-2) + 1
				y := rand.Intn(h-2) + 1
				buf.GetElement(x, y).Rune = rune(rand.Intn(3) + 176)
				buf.GetElement(x, y).Color.Fg = rand.Intn(8)
				buf.GetElement(x, y).Color.Bg = rand.Intn(8)
				if rand.Intn(2) == 1 {
					buf.GetElement(x, y).Color.Bold = true
				}
			}

			s := conBuf.Refresh()

			msg := websocks.Msg{}
			msg.Type = "ascii"
			msg.Message = s
			c.Send(msg)
		}

	})

	goji.Get("/ws/:id", server.WebsocketHandler)
	goji.Get("/ws/", server.WebsocketHandler)
	goji.Get("/*", http.FileServer(http.Dir("./web")))
	go goji.Serve()

	for {
		<-time.After(time.Second)
	}
}
