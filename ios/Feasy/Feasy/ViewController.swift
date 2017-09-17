//
//  ViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 9/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

        LoginManager.setUsername(username: "test")
        LoginManager.setPassword(password: "test")
        
        UserService.login() { response, json in
            print(json)
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}

