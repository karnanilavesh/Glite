package main

import b64 "encoding/base64"
import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"unicode/utf8"
)

var home, lastProjectPath, lastPath string

type Glite struct {
	Html []byte
	Css  []byte
	Js   []byte
	Path []byte
	Name []byte
}
type newProject struct {
	Name   string
	Html   bool
	Css    bool
	Js     bool
	Jquery bool
	Bs     bool
}
type file struct {
	Name   string
	Data   string
	Type   string
	Path   string
	Dir    string
	Binary bool
}
type cnfFile struct {
	Name   string
	Html   []string
	Css    []string
	Js     []string
	Jquery bool
	Bs     bool
}
type CError struct {
	Message string
}

func (e CError) Error() string {
	return fmt.Sprintf("%v", e.Message)
}
func pathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}
func isDir(path string) (bool, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return false, err
	}
	return fileInfo.IsDir(), err
}
func isBinary(path string) bool {
	return !utf8.ValidString(path)
}
func (g *Glite) saveProject() error {
	path := string(g.Path)
	pe, _ := pathExists(path)
	if pe != true {
		os.MkdirAll(string(filepath.Separator)+path, 0777)
		fmt.Println(path + " created")
	}
	herr := ioutil.WriteFile(path+"index1.html", g.Html, 0777)
	cerr := ioutil.WriteFile(path+"style.css", g.Css, 0777)
	jerr := ioutil.WriteFile(path+"script.js", g.Js, 0777)
	cferr := ioutil.WriteFile(path+"proj.cnf", []byte("configuration"), 0777)
	if herr != nil || cerr != nil || jerr != nil || cferr != nil {
		return CError{Message: "Write error"}
	}
	return nil
}
func importProject(path string) (string, error) {
	a, _ := pathExists(path + "proj.cnf")
	if a != true {
		return "error", CError{Message: "not project"}
	}
	html, herr := ioutil.ReadFile(path + "index1.html")
	css, cerr := ioutil.ReadFile(path + "style.css")
	js, jerr := ioutil.ReadFile(path + "script.js")
	if herr != nil || cerr != nil || jerr != nil {
		return "error", CError{Message: "Reading Error"}
	}
	g := &Glite{Html: []byte(html), Css: []byte(css), Js: []byte(js), Path: []byte(path)}
	gjson, err := json.Marshal(g)
	if err != nil {
		return "error", CError{Message: "json creation Error"}
	}
	return string(gjson), nil
}
func openFile(path string) (string, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Println("[file error] file read error")
		return "", err
	}
	dir, name := filepath.Split(path)
	fileType := filepath.Ext(path)
	binary := isBinary(string(data))
	f := &file{Name: name, Data: b64.StdEncoding.EncodeToString(data), Dir: dir, Type: fileType, Path: path, Binary: binary}
	fjson, err1 := json.Marshal(f)
	if err1 != nil {
		fmt.Println("[json error] json creation error")
		return "", err1
	}
	return string(fjson), err
}
func saveProjectHandler(w http.ResponseWriter, r *http.Request) {
	html := r.FormValue("html")
	css := r.FormValue("css")
	js := r.FormValue("js")
	name := r.FormValue("name")
	path := home + "/" + name // linux
	fmt.Println(html)
	l := len(path)
	if path[l-1] != '/' { //linux
		path = path + "/"
		fmt.Println("added /")
	}
	g := &Glite{Html: []byte(html), Css: []byte(css), Js: []byte(js), Path: []byte(path), Name: []byte(name)}
	err := g.saveProject()
	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}
	fmt.Fprintf(w, "saved")
}
func importHandler(w http.ResponseWriter, r *http.Request) {
	path := r.FormValue("path")
	if len(path) < 1 {
		mode := r.FormValue("mode")
		if mode == "project" {
			if len(lastProjectPath) > 1 {
				path = lastProjectPath
				//fmt.Println("last project path imported + lp = "+lastProjectPath)
			} else {
				fmt.Fprintf(w, "nop")
				return
			}
		} else {
			if len(lastPath) > 1 {
				path = lastPath
				fjson, err1 := openFile(path)
				if err1 != nil {
					fmt.Fprintf(w, "nop")
					return
				}
				fmt.Fprintf(w, fjson)
				return
			} else {
				fmt.Fprintf(w, "nop")
				return
			}
		}
	}
	fmt.Println(path)
	s, err := importProject(path)
	if err != nil {
		fmt.Fprintf(w, err.Error())
	} else {
		fmt.Fprintf(w, s)
	}
}
func ftHandler(w http.ResponseWriter, r *http.Request) {
	path := r.FormValue("dir")
	head := "<ul class=\"jqueryFileTree\" style=\"display: none;\"> \n"
	files, _ := ioutil.ReadDir(path)
	for _, f := range files {
		if b, _ := pathExists(path + f.Name()); b {
			//fmt.Println(path)
			a, _ := isDir(path + f.Name())

			if a {
				c, _ := pathExists(path + f.Name() + "/proj.cnf")
				s := ""
				if c != true {
					s = fmt.Sprintf("<li class=\"directory collapsed\"><a href=\"#\" rel=\"%s/\"> %s </a></li> \n", path+f.Name(), f.Name())
				} else {
					s = fmt.Sprintf("<li class=\"file ext_%s\"><a href=\"#\" rel=\"%s\"> %s </a></li> \n", "gproj", path+f.Name(), f.Name())
				}
				head = head + s

			} else {
				//gproj ext for the folder
				ext := strings.Split(f.Name(), ".")
				l := len(ext)
				if l > 1 {
					ext[0] = ext[l-1]
				} else {
					ext[0] = "unknown"
				}
				s := fmt.Sprintf("<li class=\"file ext_%s\"><a href=\"#\" rel=\"%s\"> %s </a></li> \n", ext[0], path+f.Name(), f.Name())
				head = head + s
			}
		}
	}
	head = head + "</ul>"
	fmt.Fprintf(w, head)
}
func createHandler(w http.ResponseWriter, r *http.Request) {
	s := r.FormValue("project")
	var newProj newProject
	json.Unmarshal([]byte(s), &newProj)
	path := home + "/" + newProj.Name
	e := os.Mkdir(string(filepath.Separator)+path, 0777)
	if e != nil {
		fmt.Fprintf(w, "duplicate")
		return
	}
	l := len(path)
	if path[l-1] != '/' { //linux
		path = path + "/"
		fmt.Println("added /")
	}

	lastProjectPath = path

	_, e1 := os.Create(path + "index.html")
	html := []string{"index.html"}
	var css, js []string
	if newProj.Css {
		os.Create(path + "style.css")
		css = []string{"style.css"}
	}
	if newProj.Js {
		os.Create(path + "script.js")
		js = []string{"script.js"}
	}
	cf := &cnfFile{Name: newProj.Name, Jquery: newProj.Jquery, Bs: newProj.Bs, Html: html, Css: css, Js: js}
	cfjson, jerr := json.Marshal(cf)
	if jerr != nil {
		fmt.Fprintf(w, "error")
		return 
	}
	ep := ioutil.WriteFile(path+"proj.cnf", cfjson, 0777)

	if e1 != nil || e != nil || ep != nil {
		fmt.Fprintf(w, "error")
	} else {
		fmt.Fprintf(w, path)
	}
}
func openProjectHandler(w http.ResponseWriter, r *http.Request) {
	path := r.FormValue("path")
	fmt.Println("openproj = ",path);
	if pe, _ := pathExists(path + "proj.cnf"); pe {
		lastProjectPath = path
		http.Redirect(w, r, "/index.html", http.StatusFound)
	} else {
		lastPath = path
		fmt.Println("recv ", path)
		http.Redirect(w, r, "/editor.html", http.StatusFound)
	}
}
func openHandler(w http.ResponseWriter, r *http.Request) {
	path := r.FormValue("filePath")
	fmt.Println(path)
	pe, _ := pathExists(path)
	if pe != true {
		fmt.Println("[path error] file not found")
		fmt.Fprintf(w, "nop")
		return
	}

	//fmt.Fprintf(w,  b64.StdEncoding.EncodeToString(file))
	fjson, err1 := openFile(path)
	if err1 != nil {
		fmt.Fprintf(w, "nop")
		return
	}
	fmt.Fprintf(w, fjson)
}
func saveHandler(w http.ResponseWriter, r *http.Request) {
	path := r.FormValue("filePath")
	recvdData := r.FormValue("data")
	data, errb64 := b64.StdEncoding.DecodeString(recvdData)
	if errb64 != nil {
		fmt.Fprintf(w, "error")
		return
	}
	err := ioutil.WriteFile(path, []byte(data), 0777)
	if err != nil {
		fmt.Fprintf(w, "error")
		return
	}
	fmt.Fprintf(w, "done")
}
func main() {
	if runtime.GOOS == "windows" {
		home = "C:\\glite"
		fmt.Println("Hello from Windows")
	}
	if runtime.GOOS == "linux" {
		home = "/glite"
		fmt.Println("Hello from linux")
	}
	pe, _ := pathExists(home)
	if pe != true {
		e := os.Mkdir(string(filepath.Separator)+home, 0777)
		if e != nil {
			fmt.Println("error")
		}
		fmt.Println("created")
	}
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)
	http.HandleFunc("/saveProject/", saveProjectHandler)
	http.HandleFunc("/save/", saveHandler)
	http.HandleFunc("/open/", openHandler)
	http.HandleFunc("/import/", importHandler)
	http.HandleFunc("/filetree/", ftHandler)
	http.HandleFunc("/create/", createHandler)
	http.HandleFunc("/openProject/", openProjectHandler)
	http.ListenAndServe(":80", nil)
}
