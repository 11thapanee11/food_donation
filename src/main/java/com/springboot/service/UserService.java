package com.springboot.service;

import com.springboot.dto.LoginDto;
import com.springboot.dto.MemberDto;
import com.springboot.dto.RegisterDto;
import com.springboot.model.User;
import com.springboot.repository.UserRepository;
import com.springboot.util.JwtUtil;
import com.springboot.util.PasswordUtil;
import java.util.*;

import java.security.NoSuchAlgorithmException;

// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    // @Autowired
    private final UserRepository userRepository;

    private final JwtUtil jwtUtil;

    private final PasswordUtil passwordUtil;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordUtil = PasswordUtil.getInstance();
        this.jwtUtil = jwtUtil;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้งานด้วยอีเมลนี้: " + email));
    }

    public User authenticate(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String idStr = jwtUtil.extractUserId(token);

        if (!jwtUtil.validateToken(token, idStr)) {
            throw new IllegalArgumentException("Token ไม่ถูกต้องหรือหมดอายุ");
        }

        Integer userId = Integer.parseInt(idStr);
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบสิทธิ์และข้อมูลบัญชีผู้ใช้ในระบบ"));
    }

    public boolean registerUser(RegisterDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("ข้อมูลผู้ใช้ซ้ำกรุณา ลองใหม่อีกครั้ง"); // มี email ซ้ำ
        }

        try {
            String hashedPassword = passwordUtil.createPassword(request.getPassword(), request.getEmail());

            User user = new User();
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPhoneNumber(request.getPhoneNumber());
            user.setPassword(hashedPassword);

            userRepository.save(user);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // public User login(String email, String password) {
    // return userRepository.findByEmail(email)
    // .filter(user -> {
    // try {
    // String hashedPassword = passwordUtil.createPassword(password, email);
    // return user.getPassword().equals(hashedPassword);
    // } catch (Exception e) {
    // return false;
    // }
    // })
    // .orElse(null);
    // }

    public boolean login(LoginDto loginDto) {
        try {
            String hashedPassword = PasswordUtil.getInstance()
                    .createPassword(loginDto.getPassword(), loginDto.getEmail());
            return userRepository.findByEmailAndPassword(
                    loginDto.getEmail(), hashedPassword).isPresent();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public MemberDto getMemberProfile(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบข้อมูลรายละเอียดสมาชิก"));

        return new MemberDto(
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber());
    }

    public boolean updateMemberProfile(String email, MemberDto updatedProfile) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setFirstName(updatedProfile.getFirstName());
            user.setLastName(updatedProfile.getLastName());
            user.setPhoneNumber(updatedProfile.getPhoneNumber());
            userRepository.save(user);
            return true;
        }
        return false;
    }

}
