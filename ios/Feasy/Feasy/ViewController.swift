//
//  ViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 9/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
  
  @IBOutlet weak var welcomeMessageButton: UIButton!
  @IBOutlet weak var welcomeMessageTextLabel: UILabel!
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
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
  
  @IBAction func welcomeMessageButtonPressed(_ sender: UIButton) {
    UserService.getWelcomeMessage() { response, json in
      let message: String = json["message"] as? String ?? "Couldn't get the welcome message!"
      self.updateWelcomeMessageLabel(withMessage: message)
      
      // Clear the message after 3 seconds
      DispatchQueue.main.asyncAfter(deadline: .now() + 3.0, execute: {
        self.updateWelcomeMessageLabel(withMessage: "")
      })
    }
  }
  
  func updateWelcomeMessageLabel(withMessage message: String) {
    DispatchQueue.main.async {
      self.welcomeMessageTextLabel.text = message
    }
  }
}
