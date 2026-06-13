package com.example.helloworld;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class IndexController {

    // Serve index.html for the root URL (React SPA entry point)
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}
