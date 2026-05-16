package db

import (
	"encoding/json"
	"log"

	"golang.org/x/crypto/bcrypt"
)

type seedQuestion struct {
	Text          string
	Options       map[string]string
	CorrectAnswer string
	Point         int
}

func addQuizWithQuestions(name string, questions []seedQuestion) {
	var quizID int
	err := DB.QueryRow(`INSERT INTO quizzes (name) VALUES ($1) RETURNING id`, name).Scan(&quizID)
	if err != nil {
		log.Printf("Failed to seed quiz %s: %v", name, err)
		return
	}

	for _, q := range questions {
		optJSON, _ := json.Marshal(q.Options)
		_, err := DB.Exec(
			`INSERT INTO questions (quiz_id, text, options, correct_answer, point)
			 VALUES ($1, $2, $3, $4, $5)`,
			quizID, q.Text, optJSON, q.CorrectAnswer, q.Point,
		)
		if err != nil {
			log.Printf("Failed to seed question for %s: %v", name, err)
		}
	}
}

func Seed() {
	seedUsers()

	var count int
	DB.QueryRow(`SELECT COUNT(*) FROM quizzes`).Scan(&count)
	if count > 0 {
		log.Println("Database already seeded with quizzes, skipping seed.")
		return
	}

	addQuizWithQuestions("Ilmu Pendidikan Alam", []seedQuestion{
		{Text: "Hewan apa yang memiliki punuk untuk menyimpan cadangan makanan?", Options: map[string]string{"A": "Gajah", "B": "Unta", "C": "Jerapah", "D": "Kuda"}, CorrectAnswer: "B", Point: 10},
		{Text: "Apa gas yang dibutuhkan manusia untuk bernapas?", Options: map[string]string{"A": "Nitrogen", "B": "Karbondioksida", "C": "Oksigen", "D": "Helium"}, CorrectAnswer: "C", Point: 10},
		{Text: "Bagian tumbuhan yang berfungsi menyerap air dari dalam tanah adalah?", Options: map[string]string{"A": "Daun", "B": "Batang", "C": "Akar", "D": "Bunga"}, CorrectAnswer: "C", Point: 10},
		{Text: "Benda langit yang memancarkan cahayanya sendiri disebut?", Options: map[string]string{"A": "Bintang", "B": "Planet", "C": "Bulan", "D": "Meteor"}, CorrectAnswer: "A", Point: 10},
		{Text: "Berapa jumlah kaki pada serangga seperti semut atau belalang?", Options: map[string]string{"A": "4", "B": "6", "C": "8", "D": "10"}, CorrectAnswer: "B", Point: 10},
		{Text: "Proses pembuatan makanan pada tumbuhan hijau disebut?", Options: map[string]string{"A": "Fotosintesis", "B": "Respirasi", "C": "Oksidasi", "D": "Transpirasi"}, CorrectAnswer: "A", Point: 10},
		{Text: "Manakah hewan yang termasuk amfibi?", Options: map[string]string{"A": "Ular", "B": "Ikan", "C": "Katak", "D": "Burung"}, CorrectAnswer: "C", Point: 10},
		{Text: "Gigi yang berfungsi untuk mengunyah makanan disebut gigi?", Options: map[string]string{"A": "Seri", "B": "Taring", "C": "Geraham", "D": "Susu"}, CorrectAnswer: "C", Point: 10},
		{Text: "Planet ketiga dalam tata surya kita adalah?", Options: map[string]string{"A": "Mars", "B": "Venus", "C": "Bumi", "D": "Jupiter"}, CorrectAnswer: "C", Point: 10},
		{Text: "Zat hijau daun pada tumbuhan disebut?", Options: map[string]string{"A": "Stomata", "B": "Klorofil", "C": "Kloroplas", "D": "Enzim"}, CorrectAnswer: "B", Point: 10},
	})

	addQuizWithQuestions("Ilmu Pengetahuan Sosial", []seedQuestion{
		{Text: "Siapakah yang membacakan teks proklamasi kemerdekaan Indonesia?", Options: map[string]string{"A": "Moh. Hatta", "B": "Ir. Soekarno", "C": "Sutan Syahrir", "D": "Sayuti Melik"}, CorrectAnswer: "B", Point: 10},
		{Text: "Apa nama mata uang negara Indonesia?", Options: map[string]string{"A": "Ringgit", "B": "Dollar", "C": "Rupiah", "D": "Yen"}, CorrectAnswer: "C", Point: 10},
		{Text: "Gunung tertinggi di pulau Jawa adalah?", Options: map[string]string{"A": "Gunung Merapi", "B": "Gunung Bromo", "C": "Gunung Semeru", "D": "Gunung Slamet"}, CorrectAnswer: "C", Point: 10},
		{Text: "Indonesia terletak di antara dua samudera, yaitu Pasifik dan?", Options: map[string]string{"A": "Atlantik", "B": "Hindia", "C": "Arktik", "D": "Antartika"}, CorrectAnswer: "B", Point: 10},
		{Text: "Negara tetangga Indonesia yang berbentuk kerajaan adalah?", Options: map[string]string{"A": "Singapura", "B": "Filipina", "C": "Thailand", "D": "Vietnam"}, CorrectAnswer: "C", Point: 10},
		{Text: "Ibukota negara Indonesia saat ini adalah?", Options: map[string]string{"A": "Bandung", "B": "Surabaya", "C": "Jakarta", "D": "Yogyakarta"}, CorrectAnswer: "C", Point: 10},
		{Text: "Candi Borobudur terletak di provinsi?", Options: map[string]string{"A": "Jawa Barat", "B": "Jawa Tengah", "C": "Jawa Timur", "D": "Bali"}, CorrectAnswer: "B", Point: 10},
		{Text: "Benua terkecil di dunia adalah?", Options: map[string]string{"A": "Asia", "B": "Eropa", "C": "Australia", "D": "Afrika"}, CorrectAnswer: "C", Point: 10},
		{Text: "Lagu kebangsaan Indonesia adalah?", Options: map[string]string{"A": "Indonesia Pusaka", "B": "Indonesia Raya", "C": "Garuda Pancasila", "D": "Maju Gentar"}, CorrectAnswer: "B", Point: 10},
		{Text: "Alat musik angklung berasal dari daerah?", Options: map[string]string{"A": "Jawa Tengah", "B": "Sumatera Barat", "C": "Jawa Barat", "D": "Papua"}, CorrectAnswer: "C", Point: 10},
	})

	addQuizWithQuestions("Matematika", []seedQuestion{
		{Text: "Berapakah hasil dari 15 + 25?", Options: map[string]string{"A": "30", "B": "35", "C": "40", "D": "45"}, CorrectAnswer: "C", Point: 10},
		{Text: "Berapakah hasil dari 50 - 18?", Options: map[string]string{"A": "32", "B": "22", "C": "42", "D": "38"}, CorrectAnswer: "A", Point: 10},
		{Text: "Hasil dari 7 x 8 adalah?", Options: map[string]string{"A": "48", "B": "54", "C": "56", "D": "64"}, CorrectAnswer: "C", Point: 10},
		{Text: "Hasil dari 81 dibagi 9 adalah?", Options: map[string]string{"A": "7", "B": "8", "C": "9", "D": "10"}, CorrectAnswer: "C", Point: 10},
		{Text: "Berapa jumlah sudut pada bangun persegi?", Options: map[string]string{"A": "2", "B": "3", "C": "4", "D": "5"}, CorrectAnswer: "C", Point: 10},
		{Text: "Berapa hasil dari 100 x 2?", Options: map[string]string{"A": "200", "B": "300", "C": "400", "D": "500"}, CorrectAnswer: "A", Point: 10},
		{Text: "Hasil dari 25 + 25 + 25 adalah?", Options: map[string]string{"A": "50", "B": "75", "C": "100", "D": "125"}, CorrectAnswer: "B", Point: 10},
		{Text: "Berapa jumlah bulan dalam satu tahun?", Options: map[string]string{"A": "10", "B": "11", "C": "12", "D": "13"}, CorrectAnswer: "C", Point: 10},
		{Text: "Hasil dari 5 x 5 adalah?", Options: map[string]string{"A": "10", "B": "20", "C": "25", "D": "30"}, CorrectAnswer: "C", Point: 10},
		{Text: "Berapa jumlah jari pada satu tangan manusia normal?", Options: map[string]string{"A": "4", "B": "5", "C": "6", "D": "10"}, CorrectAnswer: "B", Point: 10},
	})

	addQuizWithQuestions("Bahasa Indonesia", []seedQuestion{
		{Text: "Lawan kata dari 'Haus' adalah?", Options: map[string]string{"A": "Lapar", "B": "Kenyang", "C": "Puas", "D": "Segar"}, CorrectAnswer: "C", Point: 10},
		{Text: "Kata tanya yang digunakan untuk menanyakan tempat adalah?", Options: map[string]string{"A": "Siapa", "B": "Kapan", "C": "Dimana", "D": "Mengapa"}, CorrectAnswer: "C", Point: 10},
		{Text: "Kalimat yang diakhiri dengan tanda seru (!) biasanya merupakan kalimat?", Options: map[string]string{"A": "Tanya", "B": "Perintah", "C": "Berita", "D": "Pasif"}, CorrectAnswer: "B", Point: 10},
		{Text: "Pemeran utama dalam sebuah cerita disebut?", Options: map[string]string{"A": "Antagonis", "B": "Protagonis", "C": "Figuran", "D": "Sutradara"}, CorrectAnswer: "B", Point: 10},
		{Text: "Lawan kata dari 'Rajin' adalah?", Options: map[string]string{"A": "Pintar", "B": "Cerdas", "C": "Malas", "D": "Tekun"}, CorrectAnswer: "C", Point: 10},
		{Text: "Dongeng tentang hewan yang berperilaku seperti manusia disebut?", Options: map[string]string{"A": "Legenda", "B": "Mite", "C": "Fabel", "D": "Sage"}, CorrectAnswer: "C", Point: 10},
		{Text: "Ibukota negara Indonesia adalah Jakarta. Kata 'Jakarta' harus diawali dengan huruf?", Options: map[string]string{"A": "Kecil", "B": "Besar/Kapital", "C": "Miring", "D": "Tebal"}, CorrectAnswer: "B", Point: 10},
		{Text: "Persamaan kata dari 'Giat' adalah?", Options: map[string]string{"A": "Malas", "B": "Lambat", "C": "Rajin", "D": "Diam"}, CorrectAnswer: "C", Point: 10},
		{Text: "Alat untuk menulis di buku adalah?", Options: map[string]string{"A": "Penghapus", "B": "Penggaris", "C": "Pensil", "D": "Tas"}, CorrectAnswer: "C", Point: 10},
		{Text: "Buku adalah jendela?", Options: map[string]string{"A": "Rumah", "B": "Kamar", "C": "Dunia", "D": "Sekolah"}, CorrectAnswer: "C", Point: 10},
	})

	addQuizWithQuestions("Pendidikan Kewarganegaraan", []seedQuestion{
		{Text: "Sila pertama Pancasila dilambangkan dengan gambar?", Options: map[string]string{"A": "Rantai", "B": "Bintang", "C": "Pohon Beringin", "D": "Kepala Banteng"}, CorrectAnswer: "B", Point: 10},
		{Text: "Bhinneka Tunggal Ika artinya adalah?", Options: map[string]string{"A": "Bersatu kita teguh", "B": "Berbeda-beda tetapi tetap satu", "C": "Satu nusa satu bangsa", "D": "Merdeka atau mati"}, CorrectAnswer: "B", Point: 10},
		{Text: "Warna bendera negara Indonesia adalah?", Options: map[string]string{"A": "Merah dan Biru", "B": "Putih dan Merah", "C": "Merah dan Putih", "D": "Kuning dan Hijau"}, CorrectAnswer: "C", Point: 10},
		{Text: "Siapa presiden pertama Republik Indonesia?", Options: map[string]string{"A": "Soeharto", "B": "Ir. Soekarno", "C": "B.J. Habibie", "D": "Megawati"}, CorrectAnswer: "B", Point: 10},
		{Text: "Berapa jumlah sila dalam Pancasila?", Options: map[string]string{"A": "3", "B": "4", "C": "5", "D": "6"}, CorrectAnswer: "C", Point: 10},
		{Text: "Sila ke-3 Pancasila berbunyi?", Options: map[string]string{"A": "Ketuhanan Yang Maha Esa", "B": "Kemanusiaan yang adil dan beradab", "C": "Persatuan Indonesia", "D": "Keadilan sosial"}, CorrectAnswer: "C", Point: 10},
		{Text: "Pancasila terdiri dari berapa kata dasar?", Options: map[string]string{"A": "Satu", "B": "Dua", "C": "Tiga", "D": "Empat"}, CorrectAnswer: "B", Point: 10},
		{Text: "Hari Kemerdekaan Indonesia diperingati setiap tanggal?", Options: map[string]string{"A": "10 November", "B": "21 April", "C": "17 Agustus", "D": "1 Juni"}, CorrectAnswer: "C", Point: 10},
		{Text: "Semboyan negara Indonesia adalah?", Options: map[string]string{"A": "Tut Wuri Handayani", "B": "Bhinneka Tunggal Ika", "C": "Ing Ngarsa Sung Tuladha", "D": "Jalesveva Jayamahe"}, CorrectAnswer: "B", Point: 10},
		{Text: "Kepala banteng adalah lambang Pancasila sila ke?", Options: map[string]string{"A": "2", "B": "3", "C": "4", "D": "5"}, CorrectAnswer: "C", Point: 10},
	})

	log.Println("Seed completed: All 5 quizzes now have 10 questions each")
}

func seedUsers() {
	var count int
	DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count)
	if count > 0 {
		return
	}

	hashedAdmin, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	hashedUser, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)

	_, err := DB.Exec(
		`INSERT INTO users (username, password, full_name, email, role) VALUES 
		 ($1, $2, 'admin', 'admin@gmail.com', 'admin'),
		 ($3, $4, 'Regular User', 'user@example.com', 'user')`,
		"admin", string(hashedAdmin), "user", string(hashedUser),
	)
	if err != nil {
		log.Println("Failed to seed users:", err)
	} else {
		log.Println("Seed users completed: admin and user created")
	}
}